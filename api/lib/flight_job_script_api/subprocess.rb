#==============================================================================
# Copyright (C) 2021-present Alces Flight Ltd.
#
# This file is part of Flight Job Script Service.
#
# This program and the accompanying materials are made available under
# the terms of the Eclipse Public License 2.0 which is available at
# <https://www.eclipse.org/legal/epl-2.0>, or alternative license
# terms made available by Alces Flight Ltd - please direct inquiries
# about licensing to licensing@alces-flight.com.
#
# Flight Job Script Service is distributed in the hope that it will be useful, but
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR
# IMPLIED INCLUDING, WITHOUT LIMITATION, ANY WARRANTIES OR CONDITIONS
# OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY OR FITNESS FOR A
# PARTICULAR PURPOSE. See the Eclipse Public License 2.0 for more
# details.
#
# You should have received a copy of the Eclipse Public License 2.0
# along with Flight Job Script Service. If not, see:
#
#  https://opensource.org/licenses/EPL-2.0
#
# For more information on Flight Job Script Service, please visit:
# https://github.com/openflighthpc/flight-job-script-service
#==============================================================================

module FlightJobScriptAPI
  class Subprocess
    class Result < Struct.new(:stdout, :stderr, :exitstatus, :pid); end

    def initialize(dir:, env:, gid:, logger:, timeout:, uid:)
      @dir = dir
      @env = env
      @gid = gid
      @logger = logger
      @timeout = timeout
      @uid = uid
    end

    def run(cmd, stdin, &block)
      @stdout = ""
      @stderr = ""
      @read_threads = []
      start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

      create_pipes
      run_fork do
        run_command(cmd, &block)
      end
      start_read_threads
      write_stdin(stdin)
      status = wait_for_process
      wait_for_read_threads(start_time)
      exit_code = determine_exit_code(status)

      Result.new(@stdout, @stderr, exit_code, @pid)
    ensure
      close_pipes
    end

    private

    def run_fork(&block)
      @pid = Kernel.fork do
        @out_read.close
        @err_read.close
        @in_write.close

        Process::Sys.setgid(@gid)
        Process::Sys.setuid(@uid)
        Process.setsid

        block.call if block
      end
      @logger.debug("Forked process #{@pid.inspect}")
      @out_write.close
      @err_write.close
      @in_read.close
    end

    def run_command(cmd, &block)
      block.call(@out_write, @err_write) if block
      if cmd.nil?
        @logger.debug("Nothing to exec")
        return 
      end

      opts = {
        unsetenv_others: true,
        close_others: true,
        chdir: @dir,
        out: @out_write,
        err: @err_write,
        in: @in_read,
      }
      @logger.debug("Execing cmd")
      Kernel.exec(@env, *cmd, **opts)
    end

    def start_read_threads
      [ [@out_read, @stdout], [@err_read, @stderr] ].each do |io, buffer|
        @read_threads << Thread.new do
          begin
            loop { buffer << io.readpartial(1024) }
          rescue IOError
            # NOOP - Both EOF and IO closed errors need to be caught
          end
        end
      end
    end

    def write_stdin(stdin)
      return if stdin.nil?
      # We assume here that stdin is small enough to not cause an issue.  The
      # process and the read threads have been started so we should be OK with
      # that assumption.
      @in_write.write(stdin)
    end

    def wait_for_process
      signal = 'TERM'
      begin
        @logger.debug("Waiting for pid: #{@pid}")
        Timeout.timeout(@timeout) do
          Process.wait(@pid)
        end
      rescue Timeout::Error
        @logger.error("Sending #{signal} to: #{@pid}")
        Process.kill(-Signal.list[signal], @pid)
        signal = 'KILL'
        retry
      end
      $?
    end

    def determine_exit_code(status)
      if @read_threads.any?(&:alive?)
        @logger.warn "Read threads still alive.  Setting exit code to 128."
        128
      elsif status.exitstatus
        status.exitstatus
      elsif status.signaled?
        @logger.warn <<~WARN.chomp
          Inferring exit code from signal #{Signal.signame(status.termsig)} (pid: #{@pid})
        WARN
        status.termsig + 128
      else
        @logger.error "No exit code provided (pid: #{@pid})!"
        128
      end
    end

    # Wait for the remaining timeout for the read threads to finish.
    #
    # As the subprocess has completed, we would usually expect that the pipes
    # are closed and the next reads will read any remaining data.  There are
    # some circumstances, involving zombie grandchild processes, where that
    # might not be the case.
    #
    # We want to ensure that waiting on the read threads does not cause
    # `Subprocess#run` to hang for longer than `@timeout`.
    def wait_for_read_threads(start_time)
      loop do
        break if @read_threads.none?(&:alive?)

        now = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        remaining = @timeout + start_time - now
        break unless remaining > 0

        @read_threads.select(&:alive?).first.join(remaining)
      end
    end

    def create_pipes
      @out_read, @out_write = IO.pipe
      @err_read, @err_write = IO.pipe
      @in_read,  @in_write  = IO.pipe
    end

    def close_pipes
      @out_read.close  if @out_read  && !@out_read.closed?
      @out_write.close if @out_write && !@out_write.closed?
      @err_read.close  if @err_read  && !@err_read.closed?
      @err_write.close if @err_write && !@err_write.closed?
      @in_read.close   if @in_read   && !@in_read.closed?
      @in_write.close  if @in_write  && !@in_write.closed?
    end
  end
end

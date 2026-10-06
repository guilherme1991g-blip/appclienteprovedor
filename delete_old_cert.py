import pty
import os
import sys
import time

def run_eas():
    master, slave = pty.openpty()
    env = os.environ.copy()
    env['APP_PROVIDER'] = 'webconnect'
    
    pid = os.fork()
    if pid == 0:
        os.close(master)
        os.setsid()
        os.dup2(slave, 0)
        os.dup2(slave, 1)
        os.dup2(slave, 2)
        os.close(slave)
        os.execvpe('npx', ['npx', 'eas-cli', 'credentials', '-p', 'ios'], env)
    else:
        os.close(slave)
        step = 0
        start_time = time.time()
        
        while time.time() - start_time < 40:
            try:
                data = os.read(master, 1024)
                if not data:
                    break
                text = data.decode('utf-8', errors='ignore')
                sys.stdout.write(text)
                sys.stdout.flush()
                
                if 'Which build profile do you want to configure' in text and step == 0:
                    step = 1
                    time.sleep(0.4)
                    os.write(master, b'\x1b[B\x1b[B\x1b[B\x1b[B\r') # select production:webconnect
                elif 'log in to your Apple account' in text and step == 1:
                    step = 2
                    time.sleep(0.4)
                    os.write(master, b'n\r')
                elif 'What do you want to do' in text and step == 2:
                    step = 3
                    time.sleep(0.4)
                    os.write(master, b'\r') # Build Credentials
                elif 'What do you want to do' in text and step == 3:
                    step = 4
                    time.sleep(0.4)
                    # Select "Distribution Certificate: Delete one from your account" (3 down arrows)
                    os.write(master, b'\x1b[B\x1b[B\x1b[B\r')
                elif ('Are you sure' in text or 'Delete' in text or 'Select' in text) and step == 4:
                    step = 5
                    time.sleep(0.4)
                    os.write(master, b'\r')
                elif step >= 5:
                    time.sleep(0.5)
                    os.write(master, b'\r')
            except Exception as e:
                break
        os.close(master)

if __name__ == '__main__':
    run_eas()

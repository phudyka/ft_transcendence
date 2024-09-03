import time
import os
import subprocess


def get_file_info(path):
    file_info = {}
    for root, dirs, files in os.walk(path):
        for file in files:
            full_path = os.path.join(root, file)
            try:
                file_info[full_path] = os.path.getmtime(full_path)
            except:
                pass
    return file_info

def watch_directory(path):
    before = get_file_info(path)
    while True:
        time.sleep(1)
        after = get_file_info(path)
        added = [f for f in after if f not in before]
        removed = [f for f in before if f not in after]
        modified = [f for f in before if f in after and before[f] != after[f]]
        if added or removed or modified:
            print("\nDetected change. Reloading...")
            for file in added:
                print(f"Added: \033[91m{file}\033[0m")
            for file in removed:
                print(f"Removed: \033[91m{file}\033[0m")
            for file in modified:
                print(f"Modified: \033[91m{file}\033[0m")
            print(time.strftime("\033[1m\033[93m[%H:%M:%S]\033[0m"))
            subprocess.run(["docker", "compose", "restart", "web"])
        before = after

if __name__ == "__main__":
    path = './ft_trans'
    print(f"\033[94mWatching directory: \033[0m{path}")
    print(f"\033[94mCurrent directory: \033[0m{os.getcwd()}")
    print(f"\033[94mContents of {path}: \033[0m{os.listdir(path)}")
    watch_directory(path)

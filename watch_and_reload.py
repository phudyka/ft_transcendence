import time
import os
import subprocess

def watch_directory(path):
    before = dict ([(f, None) for f in os.listdir (path)])
    while True:
        time.sleep(1)
        after = dict ([(f, None) for f in os.listdir (path)])
        added = [f for f in after if not f in before]
        removed = [f for f in before if not f in after]
        if added or removed:
            print("Detected change. Reloading...")
            subprocess.run(["docker", "compose", "restart", "web"])
        before = after

if __name__ == "__main__":
    path = './ft_trans'
    watch_directory(path)
"""Assemble the CRM presentation: slide PNG + narration MP3 per scene -> MP4 (1920x1080, 30fps)."""
import os, re, subprocess, imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "build")
FF = imageio_ffmpeg.get_ffmpeg_exe()
PAD = 1.0  # seconds of visual hold after narration


def duration(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out)
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


parts = []
for i in range(1, 11):
    png = os.path.join(B, f"slide_{i:02d}.png")
    mp3 = os.path.join(B, f"narr_{i:02d}.mp3")
    dur = duration(mp3) + PAD
    out = os.path.join(B, f"scene_{i:02d}.mp4")
    subprocess.run([FF, "-y", "-loop", "1", "-i", png, "-i", mp3,
                    "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p", "-r", "30",
                    "-c:a", "aac", "-b:a", "160k", "-ar", "44100",
                    "-af", f"apad=whole_dur={dur:.2f}", "-t", f"{dur:.2f}",
                    "-vf", "scale=1920:1080", out], check=True, capture_output=True)
    parts.append(out)
    print(i, round(dur, 2))

lst = os.path.join(B, "concat.txt")
with open(lst, "w") as f:
    for p in parts:
        f.write(f"file '{p}'\n")
final = os.path.join(HERE, "crm-presentation.mp4")
subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", final],
               check=True, capture_output=True)
print("total", round(sum(duration(p) for p in parts), 1), "s ->", final)

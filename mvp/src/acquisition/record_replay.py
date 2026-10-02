# -*- coding: utf-8 -*-
"""ضبط و بازپخش جلسه‌ی اسکن — ریگ دیباگ پروژه.

ضبط: فریم‌ها در یک .npz فشرده، متادیتا در jsonl با همان ایندکس.
بازپخش: همان صف Frame با همان ترتیب و فاصله‌ی زمانی (اختیاری).
"""
from __future__ import annotations
import argparse
import json
import time
from pathlib import Path
import numpy as np

from mvp.src.acquisition.clarius_cast import FakeCastSource, Frame


def record(source, out_dir: Path, seconds: float = 5.0) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    src = source
    src.start()
    q = src.frames()
    b_list, d_list, m_list = [], [], []
    t_end = time.time() + seconds
    n = 0
    while time.time() < t_end:
        try:
            fr: Frame = q.get(timeout=1.0)
        except Exception:
            continue
        b_list.append(fr.bmode)
        d_list.append(fr.doppler if fr.doppler is not None else np.zeros_like(fr.bmode))
        m_list.append({'t': fr.t, 'imu': None if fr.imu_quat is None else fr.imu_quat.tolist(), **fr.meta})
        n += 1
    src.stop()
    np.savez_compressed(out_dir / 'frames.npz', b=np.stack(b_list), d=np.stack(d_list))
    with open(out_dir / 'meta.jsonl', 'w', encoding='utf-8') as f:
        for m in m_list:
            f.write(json.dumps(m, ensure_ascii=False) + '\n')
    (out_dir / 'README.txt').write_text('جلسه‌ی ضبط‌شده‌ی MURA — فقط برای دیباگ؛ داده‌ی بالینی نیست.', encoding='utf-8')
    return n


def replay(session_dir: Path, realtime: bool = False):
    data = np.load(session_dir / 'frames.npz')
    metas = [json.loads(l) for l in open(session_dir / 'meta.jsonl', encoding='utf-8')]
    prev = None
    for i, m in enumerate(metas):
        if realtime and prev is not None:
            time.sleep(max(0.0, m['t'] - prev))
        prev = m['t']
        yield Frame(t=m['t'], bmode=data['b'][i], doppler=data['d'][i],
                    imu_quat=None if m.get('imu') is None else np.array(m['imu']), meta=m)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fake', action='store_true')
    ap.add_argument('--replay', type=str, default=None)
    ap.add_argument('--seconds', type=float, default=3.0)
    ap.add_argument('--frames', type=int, default=0)
    ap.add_argument('--out', type=str, default='data/session_demo')
    a = ap.parse_args()
    if a.replay:
        for i, fr in enumerate(replay(Path(a.replay))):
            if a.frames and i >= a.frames:
                break
            print(f"frame {i}: t={fr.t:.3f} bmode={fr.bmode.shape} mean={fr.bmode.mean():.1f}")
    else:
        src = FakeCastSource() if a.fake else None
        if src is None:
            raise SystemExit('برای ضبط واقعی ابتدا TODO(REAL) در clarius_cast.py را اجرا کنید')
        n = record(src, Path(a.out), a.seconds)
        print(f'ضبط شد: {n} فریم در {a.out}')


if __name__ == '__main__':
    main()

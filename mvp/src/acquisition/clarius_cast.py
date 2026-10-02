# -*- coding: utf-8 -*-
"""شنونده‌ی جریان تصویر Clarius Cast + صف هم‌زمان فریم/متادیتا.

Cast یعنی استریم زنده‌ی تصویر و متادیتا «هم‌زمان که اپ Clarius اجراست».
برای توسعه‌ی آفلاین، FakeCastSource فریم‌های مصنوعی می‌سازد تا بقیه‌ی
زنجیره بدون سخت‌افزار قابل ساخت و تست باشد.
"""
from __future__ import annotations
import queue
import time
from dataclasses import dataclass, field
from typing import Optional
import numpy as np


@dataclass
class Frame:
    t: float                      # مهرزمانی ثانیه (منبع واحد برای همه‌ی جریان‌ها)
    bmode: np.ndarray             # HxW uint8
    doppler: Optional[np.ndarray] = None   # HxW uint8 (Color/Power) یا None
    imu_quat: Optional[np.ndarray] = None  # (4,) کواترنیون جهت پروب از IMU داخلی
    meta: dict = field(default_factory=dict)


class BaseSource:
    def start(self) -> None: ...
    def stop(self) -> None: ...
    def frames(self) -> "queue.Queue[Frame]": raise NotImplementedError


class FakeCastSource(BaseSource):
    """منبع جعلی: B-mode مصنوعی با یک «رگ» افقی موج‌دار + داپلر موضعی.

    فقط برای توسعه و تست پایپ‌لاین است؛ جای ground truth واقعی را نمی‌گیرد.
    """
    def __init__(self, fps: int = 20, hw: tuple = (256, 256), seed: int = 0):
        self.fps, self.hw, self.seed = fps, hw, seed
        self.q: "queue.Queue[Frame]" = queue.Queue(maxsize=120)
        self._stop = False

    def frames(self):
        return self.q

    def start(self):
        import threading
        threading.Thread(target=self._run, daemon=True).start()

    def stop(self):
        self._stop = True

    def _run(self):
        rng = np.random.default_rng(self.seed)
        h, w = self.hw
        t0 = time.time()
        i = 0
        while not self._stop:
            t = time.time() - t0
            img = rng.normal(90, 18, (h, w)).clip(0, 255).astype(np.uint8)  # اسپکل تقلیدی
            y = (h * 0.5 + 12 * np.sin(2 * np.pi * (np.arange(w) / w) + t)).astype(int)
            xs = np.arange(w)
            for dy in (-2, -1, 0, 1, 2):
                img[np.clip(y + dy, 0, h - 1), xs] = 40  # رگ هیپو‌اکو
            dop = np.zeros((h, w), np.uint8)
            dop[np.clip(y, 0, h - 1), xs] = 200
            quat = np.array([np.cos(t / 4), 0.0, np.sin(t / 4), 0.0])
            self.q.put(Frame(t=t, bmode=img, doppler=dop, imu_quat=quat,
                             meta={'source': 'fake', 'i': i}))
            i += 1
            time.sleep(1.0 / self.fps)


class ClariusCastSource(BaseSource):
    """اتصال واقعی به Clarius Cast.

    TODO(REAL):
      1) دریافت IP/پورت از اپ Clarius (فقط برای پروب لایسنس‌شده نمایش داده می‌شود)
      2) bind سوکت UDP/TCP طبق پروتکل Cast v12 (نگهداری ترتیب بسته‌ها و drop سیاست backpressure)
      3) پارس هدرهای تصویری و متادیتا (IMU 9-DOF با کواترنیون + کالیبراسیون)
      4) هم‌زمان‌سازی مهرزمانی با ساعت سیستم و ثبت offset
    تا این اجرا نشود، هیچ عدد بالینی از این مسیر قابل استناد نیست.
    """
    def __init__(self, host: str, port: int):
        self.host, self.port = host, port
        self.q: "queue.Queue[Frame]" = queue.Queue(maxsize=120)

    def frames(self):
        return self.q

    def start(self):
        raise NotImplementedError('TODO(REAL): پروتکل Cast v12 — به research/06-clarius-integration.md رجوع شود')

    def stop(self):
        pass

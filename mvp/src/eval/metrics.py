# -*- coding: utf-8 -*-
"""معیارهای سگمنتیشن با پروتول گزارش استاندارد.

قانون پروژه: هر عدد Dice که منتشر می‌شود باید با report_summary و
**به تفکیک قطر رگ و عمق** روی مجموعه‌ی آزمون ثابت گزارش شود.
"""
from __future__ import annotations
from typing import Dict, List, Sequence
import numpy as np


def dice(pred: np.ndarray, gt: np.ndarray, eps: float = 1e-8) -> float:
    p, g = pred.astype(bool), gt.astype(bool)
    inter = np.logical_and(p, g).sum()
    denom = p.sum() + g.sum()
    return float(2 * inter / denom) if denom else 0.0


def iou(pred: np.ndarray, gt: np.ndarray, eps: float = 1e-8) -> float:
    p, g = pred.astype(bool), gt.astype(bool)
    inter = np.logical_and(p, g).sum()
    union = np.logical_or(p, g).sum()
    return float(inter / union) if union else 0.0


def _boundary(mask: np.ndarray) -> np.ndarray:
    m = mask.astype(bool)
    er = m.copy()
    er[1:, :] &= m[:-1, :]
    er[:-1, :] &= m[1:, :]
    er[:, 1:] &= m[:, :-1]
    er[:, :-1] &= m[:, 1:]
    return m & ~er


def assd(pred: np.ndarray, gt: np.ndarray, spacing_mm: tuple = (0.1, 0.1)) -> float:
    """میانگین فاصله‌ی متقارن مرزی (میلی‌متر)."""
    pb, gb = _boundary(pred), _boundary(gt)
    if pb.sum() == 0 or gb.sum() == 0:
        return float('nan')
    py, px = np.nonzero(pb)
    gy, gx = np.nonzero(gb)
    sy, sx = spacing_mm
    def dir_(a_y, a_x, b_y, b_x):
        d2 = ((a_y[:, None] - b_y[None, :]) * sy) ** 2 + ((a_x[:, None] - b_x[None, :]) * sx) ** 2
        return np.sqrt(d2.min(axis=1)).mean()
    return float(0.5 * (dir_(py, px, gy, gx) + dir_(gy, gx, py, px)))


def sensitivity(pred: np.ndarray, gt: np.ndarray, eps: float = 1e-8) -> float:
    g = gt.astype(bool)
    if not g.sum():
        return 0.0
    return float(np.logical_and(pred.astype(bool), g).sum() / (g.sum() + eps))


def report_summary(cases: Sequence[Dict]) -> Dict:
    """cases: فهرستی از {'pred','gt','diameter_mm','depth_mm','spacing_mm'}."""
    out: Dict[str, List[float]] = {}
    for c in cases:
        d = dice(c['pred'], c['gt'])
        key = 'd>=0.8' if c['diameter_mm'] >= 0.8 else 'd<0.8'
        out.setdefault(key, []).append(d)
        out.setdefault('all', []).append(d)
    return {k: {'n': len(v), 'mean': float(np.mean(v)), 'std': float(np.std(v))} for k, v in out.items()}


def to_markdown(summary: Dict) -> str:
    lines = ['| گروه | n | Dice میانگین ± انحراف |', '|---|---|---|']
    for k, v in summary.items():
        lines.append(f"| {k} | {v['n']} | {v['mean']:.3f} ± {v['std']:.3f} |")
    return '\n'.join(lines)

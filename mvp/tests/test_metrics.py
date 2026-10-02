# -*- coding: utf-8 -*-
from __future__ import annotations
import numpy as np
from mvp.src.eval import metrics as M


def _mask_with_vessel(hw=(128, 128), y=64, r=3):
    gt = np.zeros(hw, bool)
    xs = np.arange(hw[1])
    for dy in range(-r, r + 1):
        gt[np.clip(y + dy, 0, hw[0] - 1), xs] = True
    return gt


def test_dice_perfect_is_one():
    gt = _mask_with_vessel()
    assert abs(M.dice(gt.copy(), gt) - 1.0) < 1e-6


def test_dice_empty_is_zero():
    gt = _mask_with_vessel()
    assert M.dice(np.zeros_like(gt), gt) == 0.0


def test_dice_shift_degrades():
    gt = _mask_with_vessel()
    pr = np.roll(gt, 4, axis=0)
    d = M.dice(pr, gt)
    assert 0.0 < d < 1.0


def test_iou_le_dice():
    gt = _mask_with_vessel()
    pr = np.roll(gt, 2, axis=0)
    assert M.iou(pr, gt) <= M.dice(pr, gt) + 1e-9


def test_assd_zero_for_identical():
    gt = _mask_with_vessel()
    assert M.assd(gt.copy(), gt) < 1e-6


def test_assd_grows_with_shift():
    gt = _mask_with_vessel()
    a1 = M.assd(np.roll(gt, 2, axis=0), gt)
    a2 = M.assd(np.roll(gt, 6, axis=0), gt)
    assert a2 > a1 > 0


def test_report_summary_buckets():
    gt = _mask_with_vessel()
    cases = [
        {'pred': gt.copy(), 'gt': gt, 'diameter_mm': 1.0, 'depth_mm': 3},
        {'pred': np.roll(gt, 2, 0), 'gt': gt, 'diameter_mm': 0.6, 'depth_mm': 4},
    ]
    s = M.report_summary(cases)
    assert s['d>=0.8']['mean'] == 1.0
    assert s['d<0.8']['mean'] < 1.0
    md = M.to_markdown(s)
    assert '| گروه |' in md

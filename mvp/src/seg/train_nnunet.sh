#!/usr/bin/env bash
# baseline پذیرفته‌شده: nnU-Net v2 — بدون این خط، هیچ مقایسه‌ای با SOTA معتبر نیست.
# پیش‌نیاز: pip install nnunetv2 و تنظیم nnUNet_raw / nnUNet_preprocessed / nnUNet_results
set -euo pipefail
TASK=${1:-Task001_MURA}
FOLDS=${2:-0}
nnUNetv2_plan_and_preprocess -d "$TASK" --verify_dataset_presence
nnUNetv2_train "$TASK" 2d "$FOLDS"
nnUNetv2_predict -i "$nnUNet_raw/$TASK/imagesTs" -o "$nnUNet_results/predTs" -d "$TASK" -c 2d -f "$FOLDS"
# سپس با mvp/src/eval/metrics.py روی مجموعه‌ی طلایی ارزیابی و با report.py منتشر شود.

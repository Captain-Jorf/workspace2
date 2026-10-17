// دسترسی نقش‌ها. مدیر همه‌کاره است؛ فروشنده و پشتیبان محدودتر.
export const ROLES = {
  manager: { label: 'مدیر', actions: '*' },
  sales: {
    label: 'فروشنده',
    actions: ['customer.create', 'customer.edit', 'customer.move', 'customer.activity', 'customer.archive',
      'invoice.create', 'invoice.edit', 'invoice.pay', 'note.manage', 'reports']
  },
  support: {
    label: 'پشتیبان',
    actions: ['customer.edit', 'customer.move', 'customer.activity', 'note.manage', 'reports']
  }
};

export function can(role, action) {
  const rule = ROLES[role];
  if (!rule) return false;
  return rule.actions === '*' || rule.actions.includes(action);
}

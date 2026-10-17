// نقش‌ها و مجوزها. مدیر همه‌چیز را دارد؛ حذف دائمی فقط با مدیر است.

export const ROLES = {
  manager: { label: 'مدیر', perms: 'all' },
  sales: { label: 'فروشنده', perms: ['customer.write', 'invoice.write', 'note.write'] },
  support: { label: 'پشتیبان', perms: ['customer.write', 'note.write'] }
};

export function can(role, perm) {
  const r = ROLES[role];
  if (!r) return false;
  return r.perms === 'all' || r.perms.includes(perm);
}

// The last manually edited member keeps their count; everyone else shares the remainder.
export function distributeFiles(total, members, overrides = {}, method = "Equal Split") {
  total = Math.max(0, Math.floor(Number(total) || 0));
  const counts = {};
  const manualId = method === "Custom Count"
    ? Object.keys(overrides).reverse().find(id => members.some(member => String(member.id) === id))
    : undefined;
  const manualCount = manualId === undefined ? 0 : Math.min(total, Math.max(0, Math.floor(Number(overrides[manualId]) || 0)));
  const others = members.filter(member => String(member.id) !== manualId);
  if (manualId !== undefined) counts[manualId] = others.length ? manualCount : total;
  const remaining = total - manualCount;
  const weights = others.map(member => method === "Workload Balanced" ? Math.max(1, 100 - (Number(member.workload) || 0)) : 1);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = others.map((member, index) => {
    const exact = remaining * weights[index] / weightTotal;
    counts[member.id] = Math.floor(exact);
    return { id: member.id, fraction: exact - Math.floor(exact) };
  });
  let remainder = remaining - others.reduce((sum, member) => sum + counts[member.id], 0);
  shares.sort((a, b) => b.fraction - a.fraction).forEach(member => {
    if (remainder-- > 0) counts[member.id]++;
  });
  return members.map(member => ({ ...member, count: counts[member.id] || 0 }));
}

export function editManualCount(previous, id, value, members, total) {
  const next = { ...previous };
  members.forEach(member => delete next[member.id]);
  if (value !== "") next[id] = Math.min(total, Math.max(0, Math.floor(Number(value) || 0)));
  return next;
}

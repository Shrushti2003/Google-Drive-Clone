export function getDateBucket(value) {
  const date = new Date(value);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfFileDay = new Date(date);
  startOfFileDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday - startOfFileDay) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last Week';
  if (diffDays <= 30) return 'Earlier This Month';
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function groupFilesByDate(files = []) {
  return files.reduce((groups, file) => {
    const bucket = getDateBucket(file.createdAt || file.updatedAt);
    groups[bucket] = groups[bucket] || [];
    groups[bucket].push(file);
    return groups;
  }, {});
}

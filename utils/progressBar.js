export function generateProgressBar(scoreA, scoreB, nameA = 'Team A', nameB = 'Team B') {
  const total = scoreA + scoreB;
  const percentA = total === 0 ? 50 : (scoreA / total) * 100;
  const percentB = 100 - percentA;

  const totalBars = 20;
  const barsA = Math.round((percentA / 100) * totalBars);
  const barsB = totalBars - barsA;

  const barA = '█'.repeat(barsA).padEnd(totalBars, '░');
  const barB = '█'.repeat(barsB).padEnd(totalBars, '░');

  return (
    `📊 **Event Score Progress**\n\n` +
    `🔹 ${nameA}: ${scoreA} pts\n` +
    `\`${barA}\` ${percentA.toFixed(1)}%\n\n` +
    `🔸 ${nameB}: ${scoreB} pts\n` +
    `\`${barB}\` ${percentB.toFixed(1)}%`
  );
}

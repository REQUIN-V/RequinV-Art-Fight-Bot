export function calculateTeamScores(users, attacks, defenses) {
  const teamScores = {};

  for (const user of users) {
    if (!user.team) continue;

    const team = user.team;

    // Start team score at 0
    if (!teamScores[team]) {
      teamScores[team] = { attack: 0, defend: 0, total: 0 };
    }

    // Count attack points
    const userAttacks = attacks.filter(a => a.from === user.id);
    const attackPoints = userAttacks.reduce((sum, a) => sum + a.points, 0);
    teamScores[team].attack += attackPoints;

    // Count defend points
    const userDefends = defenses.filter(d => d.from === user.id);
    const defendPoints = userDefends.reduce((sum, d) => sum + d.points, 0);
    teamScores[team].defend += defendPoints;

    // Update total
    teamScores[team].total += attackPoints + defendPoints;
  }

  return teamScores;
}

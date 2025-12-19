# TheMatch User Guide

Welcome to **TheMatch** - your comprehensive solution for managing sports leagues, tracking matches, and organizing tournaments! This guide will walk you through all the features and help you make the most of the app.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Players Management](#players-management)
3. [Custom Games](#custom-games)
4. [Leagues Management](#leagues-management)
5. [Recording Matches](#recording-matches)
6. [Seasons & Tournaments](#seasons--tournaments)
7. [Tips & Best Practices](#tips--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Launch

When you first open TheMatch, you'll see the home screen with a welcoming interface. Before you can record matches, you need to set up:

1. **Players** - The people who will be competing
2. **Leagues** (optional) - Organized competitions with specific game types
3. **Custom Games** (optional) - Your own game types beyond the built-in options

### Navigation

TheMatch uses a tab-based navigation at the bottom of the screen:

- **Players** 👥 - Manage your player roster
- **Games** 🎮 - Create and manage custom game types
- **Leagues** 🏛️ - Create and manage leagues
- **Matches** 🤝 - View and record match results
- **Tournaments** 🏆 - Manage competitive tournaments

---

## Players Management

### Adding a New Player

1. Tap the **Players** tab
2. Tap the **+** button (bottom right)
3. Enter the player's:
   - **First Name** (required)
   - **Last Name** (required)
4. Tap **Create Player**

### Viewing Player Stats

1. Go to the **Players** tab
2. Tap on any player card
3. View their:
   - Total games played
   - Win/loss record across all leagues
   - Detailed match history
   - League-specific performance

### Editing/Deleting Players

1. Go to the **Players** tab
2. Tap on a player to view their details
3. Use the **Edit** button to update their information
4. Use the **Delete** button to remove them (⚠️ This will affect historical match data)

---

## Custom Games

TheMatch comes with built-in support for **Pool**, **Darts**, **Dominos**, and **Uno**. However, you can create your own game types!

### Creating a Custom Game

1. Tap the **Games** tab
2. Tap the **+** button
3. Enter game details:
   - **Game Name** (e.g., "Texas Hold'em", "Cornhole")
   - **Min/Max Players** (2-4 players supported)
   - **Scoring Type**:
     - **Higher is Better** - Player with highest score wins
     - **Lower is Better** - Player with lowest score wins
     - **Binary (Win/Loss)** - No scoring, just winner selection
4. Add **Custom Fields** for match recording:
   - Field Name (e.g., "Bags In", "Hands Won")
   - Field Type (Number or Text)
   - Required or Optional
5. Tap **Create Game**

### Custom Field Examples

**For Cornhole:**
- "Bags In Hole" (Number, Required)
- "Bags On Board" (Number, Optional)
- "Total Score" (Number, Required)

**For Chess:**
- "Opening Used" (Text, Optional)
- "Number of Moves" (Number, Optional)
- "Time Remaining" (Text, Optional)

### Viewing Custom Games

1. Go to the **Games** tab
2. Browse your custom game library
3. Tap any game to view details
4. Edit or delete custom games as needed

---

## Leagues Management

Leagues are long-running competitions where players compete in a specific game type.

### Creating a League

1. Tap the **Leagues** tab
2. Tap the **+** button
3. Fill in league details:
   - **Name** (e.g., "Friday Night Pool")
   - **Game Type** (Pool, Darts, Dominos, Uno, or Custom)
   - **Location** (optional, e.g., "Joe's Bar")
   - **Color** - Pick a theme color for easy identification
   - **Format** - Choose between:
     - **Round-Robin** - Everyone plays everyone
     - **Ladder** - Ranked competition
     - **Swiss** - Balanced pairing system
   - **Default Duration** - Typical number of weeks per season
4. Tap **Create League**

### Adding Players to a League

1. Go to the **Leagues** tab
2. Tap on your league
3. Tap **Add Players**
4. Check the players you want to include
5. Tap **Add Selected Players**

### Viewing League Standings

1. Open your league
2. View the **Leaderboard** showing:
   - Player rankings
   - Wins and losses
   - Games played
   - Win percentage

### Creating Seasons

Seasons help organize leagues into distinct time periods:

1. Open your league
2. Tap **New Season**
3. Enter:
   - **Season Name** (e.g., "Spring 2024")
   - **Start Date**
   - **Number of Weeks**
4. Tap **Create Season**

### Recording Weekly Attendance

1. Open a season
2. For each week, mark player attendance
3. This helps track participation and schedule makeup matches

---

## Recording Matches

### Standalone Matches (No League)

1. Go to the **Matches** tab
2. Tap the **+** button
3. Select **Standalone Match**
4. Choose:
   - **Game Type** (Pool, Darts, Dominos, Uno, or Custom)
   - **Match Date**
   - **Number of Players** (if game allows variable player count)
5. Select players from your roster
6. Enter game-specific details (scores, rounds, etc.)
7. Save as:
   - **Complete** - Final results entered
   - **In Progress** - Save and continue later

### League Matches

1. Go to your **League** → **Season**
2. Tap **Record Match**
3. League and game type are pre-selected
4. Select players
5. Record match results
6. Tap **Save Match**

### Game-Specific Instructions

#### Pool
- Select game variant (8-Ball, 9-Ball, etc.)
- Select winner(s)
- No scoring required

#### Darts
- Select game variant (301, 501, Cricket, etc.)
- Select winner(s)
- No scoring required

#### Dominos
- Record rounds played
- Enter scores for each round
- Winner determined when reaching target score (100/150/200/250)
- Scores automatically calculated

#### Uno
- Record each game played
- Enter card points for remaining players
- Winner accumulates points until reaching target (200/300/500/1000)
- Scores automatically calculated

#### Custom Games
- Fill in your custom fields
- Scores automatically determine winner based on scoring type
- Or manually select winner if using Binary (Win/Loss)

### Continuing In-Progress Matches

1. Go to **Matches** tab
2. Find matches with **In Progress** badge
3. Tap **View Match**
4. Tap **Continue Match**
5. Update scores/results
6. Save as **In Progress** or **Complete**

### Viewing Match Details

1. Go to **Matches** tab
2. Tap any match card to view:
   - All participants and scores
   - Winner(s)
   - Date played
   - Game type and variant
   - League/season (if applicable)

---

## Seasons & Tournaments

### Managing Seasons

**Creating Weeks:**
- Seasons automatically create weekly schedules based on duration
- Mark attendance each week
- Schedule makeup matches for missed weeks

**Viewing Season Stats:**
- Player standings for that season
- Weekly attendance records
- Season-specific match history

**Ending a Season:**
1. Open the season
2. Tap **End Season**
3. Season marked as complete
4. Historical data preserved

### Creating Tournaments

Tournaments are single-elimination brackets perfect for season finales:

1. Open a **League** → **Season**
2. Tap **Create Tournament**
3. Enter:
   - **Tournament Name** (e.g., "Championship Bracket")
   - **Format** - Best-of-3, Best-of-5, Best-of-7, or Single-Elimination
4. Select participating players
5. Bracket auto-generated based on player count

### Running a Tournament

1. View the tournament bracket
2. Record match results round by round
3. Winners automatically advance
4. Champion crowned when final match is complete

---

## Tips & Best Practices

### Organizing Your Leagues

✅ **DO:**
- Create separate leagues for different game types
- Use descriptive names ("Monday Night 8-Ball" not just "League 1")
- Set realistic season durations (8-12 weeks works well)
- Keep player rosters updated

❌ **DON'T:**
- Mix multiple game types in one league
- Forget to record attendance
- Delete players who have match history

### Recording Matches

✅ **DO:**
- Record matches soon after playing (while fresh)
- Use "In Progress" for multi-round games you can't finish
- Double-check scores before saving
- Include match dates for accurate history

❌ **DON'T:**
- Forget to select winners for completed matches
- Enter negative scores (unless game allows it)
- Record matches with duplicate players

### Custom Games

✅ **DO:**
- Keep field names clear and simple
- Test your scoring logic with a practice match
- Mark important fields as "Required"
- Document your game rules separately

❌ **DON'T:**
- Create too many custom fields (keep it simple)
- Change game settings after recording matches
- Delete games with existing match history

### Data Management

- **Backup regularly** - Your data is stored locally on the device
- **Be careful deleting** - Deletions affect historical data
- **Keep rosters current** - Remove inactive players from league rosters
- **Review filters** - Use league/season filters to find specific matches

---

## Troubleshooting

### Common Issues

**Problem: Can't create a match - "No players available"**
- **Solution:** Go to the Players tab and add players first

**Problem: Match won't save - "Please select a winner"**
- **Solution:** Make sure you've marked at least one player as the winner (unless saving as "In Progress")

**Problem: Player not showing in league**
- **Solution:** Go to League → Add Players and make sure they're added to the league roster

**Problem: Scores not showing on match cards**
- **Solution:** This is expected for games that don't use scoring (Pool, Darts). For Uno/Dominos/Custom games, scores will appear if entered correctly

**Problem: Can't delete a player/league**
- **Solution:** Players and leagues with match history cannot be deleted to preserve data integrity. Archive inactive items instead.

**Problem: App is slow with many matches**
- **Solution:** Use filters to view specific seasons or date ranges. Consider archiving old leagues.

### Error Messages

**"Invalid table name"**
- Contact support - this is a security feature

**"All participants must be different players"**
- You've selected the same player multiple times - choose unique players

**"Match not found"**
- The match may have been deleted - return to matches list

**"Failed to save match"**
- Check your internet connection and try again
- Ensure all required fields are filled

---

## Support & Feedback

### Getting Help

If you encounter issues not covered in this guide:
1. Check the Troubleshooting section above
2. Make note of:
   - What you were trying to do
   - What happened instead
   - Any error messages
3. Contact the developer with this information

### Feature Requests

We're always looking to improve TheMatch! If you have ideas for new features:
- Built-in support for additional game types
- Enhanced statistics and analytics
- Export/import functionality
- Multi-device sync

Please share your suggestions!

---

## Quick Reference

### Workflow for New League

1. **Players** tab → Add all players
2. **Leagues** tab → Create league → Add players to roster
3. **League** → Create Season
4. **Season** → Record weekly matches
5. **Season** → Mark attendance each week
6. (Optional) **Season** → Create Tournament at end

### Workflow for Casual Play

1. **Players** tab → Add players (one-time setup)
2. **Matches** tab → New Match → Standalone
3. Select game type and players
4. Record results → Save

### Keyboard Shortcuts (Desktop/Web)

- None currently - tap interface optimized for mobile

---

**Version:** 1.0
**Last Updated:** December 2024

---

Enjoy using TheMatch! May the best player win! 🏆

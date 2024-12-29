Memex Automation Check-in Tool

This is an automation script written in Node.js for the Memex platform. It performs the following tasks:

Auto check-in
Auto claim SBT (if the account meets the requirements)
Scheduled loop to repeat tasks every 12 hours
Features
Auto Check-in: Checks the daily check-in status and completes the check-in automatically.
SBT Claiming: Automatically claims SBT if the account qualifies.
Scheduled Loop: Repeats tasks every 12 hours, supporting multiple accounts.
Colorful Log Output: Displays task status for easier monitoring.
Requirements
Node.js (>= 14.0.0)
Dependencies
axios
chalk
random-useragent
Installation and Setup
Clone the project:

git clone https://github.com/dreambabyyy/memex.git
cd memex
Install dependencies:

npm install
Prepare the data.txt file:

Save the user's query_id to the data.txt file in the root directory, one per line.
Create a queries.txt file in the project directory to configure QueryIDs (user identifiers).
Get QueryID:

If using Telegram WebApp:
Open the Telegram WebApp.
Press F12 to open Developer Tools and switch to the Console panel.
Enter the following command to get initData:
copy(Telegram.WebApp.initData)
You will get a response like:
query_id=...&user=%7B%22username%22%3A%22Alexyamin%22%7D&...
Run the script:

node memex-proxy.js
# memex

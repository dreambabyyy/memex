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

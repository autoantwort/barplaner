## install the first time
1. install node (tested with 10.x)
2. clone git repository  
3. open terminal and cd to the repository
4. cd to src/Nodejs-RestAPIs
5. npm install
6. cd to ../Nodejs-RestAPIs
7. npm install

### Enable Telegram Bot
 1. Open Telegram and Search for BotFather
 2. /start
 3. /newbot
 4. \<your bot name\>
 5. \<your bot name\>\_bot
 6. copy the access token to /src/Nodejs-RestAPIs/app/config/env.js into the `telegramAccessToken` field
 7. open the /src/Vue.js-Client/src/components/Account.vue file and search for `symposion_bot` and replace that with your bot name (ends with 'bot')

### Enable Facebook API (You need to manage a Facebook site to use this future)
 1. Visit [Facebook Developer](https://developers.facebook.com/apps/) and create a new app
 2. Open [this](https://developers.facebook.com/tools/explorer/?method=GET&path=me%2Faccounts&version=v3.2) and press "Get Token" -> "Get User Access Token"
    - Select `manage_pages` and press "Get Access Token"
 3. Copy the id of the Page (data\.id)
 4. Paste the Page id to /src/Nodejs-RestAPIs/app/config/env.js into the `symposionPageID` field
 5. Copy the Access Token and open [this](https://developers.facebook.com/tools/debug/accesstoken/) and paste the Access Token in the text field
 6. Press "Debug" and then "Extend Access Token" and enter your password
 7. Press the "Debug" button next to the new green Access Token
 8. Now copy the Access Token from the text field into the `facebookAccessToken` field of the /src/Nodejs-RestAPIs/app/config/env.js file

### If I dont have a facebook or telegramm access key
 Remove the `facebookAccessToken`, `symposionPageID` and the `telegramAccessToken` fields from the /src/Nodejs-RestAPIs/app/config/env.js file or set them to an empty string.

## Run for development
 1. open /src/Nodejs-RestAPIs/app/config/env.js and set the following:  
 `resetDatabase` : true  
 `loadOldData` : true  
 `staticVue` : false  
 `baseURL` : "http://localhost:8080"
 2. open /src/Vue.js-Client/src/http-common.js and set `baseURL` to "http://localhost:8080/api"
 3. open an terminal and cd to /src/Nodejs-RestAPIs/ and run `npm run start`
 4. open another terminal and cd to /src/Vue.js-Client/ and run `npm run serve`

 Now you can visit http://localhost:4200 and login with Name: `Test` and Password: `Test`

 ## Run for production
 1. open /src/Nodejs-RestAPIs/app/config/env.js and set the following:  
 `resetDatabase` : false  
 `loadOldData` : true (but only the first time you start the server, after that, set this field to false (otherwise old data will be added each time the server start))  
 `staticVue` : true  
 `baseURL` : "http://localhost:8080" (or where your server is running)
 2. open /src/Vue.js-Client/src/http-common.js and set `baseURL` to `baseURL` from point 1 + "/api"
 4. open a terminal and cd to /src/Vue.js-Client/ and run `npm run build`
 3. cd to /src/Nodejs-RestAPIs/ and run `npm run start`

 Now you can visit your `baseURL`

 ## Create service to run your server (for linux systems with systemd)
  1. create a file \<_your_service_name_\>.service

Content :

    [Unit]
    Description=<your description>

    [Service]
    ExecStart=/path/to/repository/src/Nodejs-RestAPIs/server.js
    Restart=always
    User=root
    # Note Debian/Ubuntu uses 'nogroup', RHEL/Fedora uses 'nobody'
    Group=nogroup
    Environment=PATH=/usr/bin:/usr/local/bin
    Environment=NODE_ENV=production
    WorkingDirectory=/path/to/repository/src/Nodejs-RestAPIs/


    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=<your_service_name>

    [Install]
    WantedBy=multi-user.target    

 2. save file and move it to /etc/systemd/system/
 3. enable start service when boot with: `systemctl enable <your_service_name>.service`
 4. `chmod +x /path/to/repository/src/Nodejs-RestAPIs/server.js`
 5. start service with `systemctl start <your_service_name>.service`

 You can stop the service with: `systemctl stop <your_service_name>.service`  
 Check the status of the service with: `systemctl status <your_service_name>.service`  
 You can restart the service with: `systemctl restart <your_service_name>.service`  
 You can restart the service with: `systemctl restart <your_service_name>.service`  
 You can view the output of the server with: `journalctl -e -u <your_service_name>`  

# Import data from the old database(you need sql dump of the old database)

  visit regex101.com

## bardienst.json

open the sql dump and go to ``INSERT INTO `bardienst` VALUES`` and copy the data(the (..),(...),... stuff) into "test string" field on regex101.com

use regex: `\((?<id>[^,]+),([^,\(\)]+),([^,\(\)]+),([^,\(\)]+),([^,\(\)]+),'([^,]*)','([^,]*)','([^,\(\)]*)',([^,\(\)]+)\),?`

use substitution: `{"id":$1,"barID":$2,"userID":$3,"status":$4,"was":$5,"von":"$6","bis":"$7","putzen":"$8","lastReminder":$9},`
 copy the result into the bardienst.json file in the src/Nodejs-RestAPIs/app/old_data/ folder

## bars.json

open the sql dump and go to ``INSERT INTO `bars` VALUES`` and copy the data(the (..),(...),... stuff) into "test string" field on regex101.com

regex: `\((?<id>[^,]+),'([^,]*)',([^,]*),([^,\(\)]*),'([^,\(\)]*)'\),?`

substitution: `{"id":$1,"name":"$2","time":$3,"mailsend":$4,"kommentar":"$5"},`

copy the result into the bars.json file in the src/Nodejs-RestAPIs/app/old_data/ folder

## user.json

open the sql dump and go to ``INSERT INTO `users` VALUES`` and copy the data(the (..),(...),... stuff) into "test string" field on regex101.com

regex: `\((?<id>[^,]+),'([^,]*)','([^,]*)','([^,]*)','([^,]*)','([^,]*)','([^,]*)',([^,]*),'([^,]*)',([^,]*),([^,]*),([^,\(\)]*),([^,\(\)]*)\),?`

substitution: `{"id":$1,"name":"$2","password":"$3","email":"$4","bday":"$5","tel":"$6","handy":"$7","userlevl":$8,"icq":"$9","aktive":$10,"putzen":$11,"reminder":$12,"punkte_offset":$13},`

copy the result into the user.json file in the src/Nodejs-RestAPIs/app/old_data/ folder

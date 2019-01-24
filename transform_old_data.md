if you have a dump from the old Database, you can create the user.json, bars.json, bardienst.json. 

visit regex101.com

copy data(the INSERT INTO ... values) into "test string" field

- bardienst.json

use regex: \((?<id>[^,]+),([^,\(\)]+),([^,\(\)]+),([^,\(\)]+),([^,\(\)]+),'([^,]*)','([^,]*)','([^,\(\)]*)',([^,\(\)]+)\),?

use substitution: {"id":$1,"barID":$2,"userID":$3,"status":$4,"was":$5,"von":"$6","bis":"$7","putzen":"$8","lastReminder":$9},

- bars.json

regex: \((?<id>[^,]+),'([^,]*)',([^,]*),([^,\(\)]*),'([^,\(\)]*)'\),?

substitution: {"id":$1,"name":"$2","time":$3,"mailsend":$4,"kommentar":"$5"},

- user.json

regex: \((?<id>[^,]+),'([^,]*)','([^,]*)','([^,]*)','([^,]*)','([^,]*)','([^,]*)',([^,]*),'([^,]*)',([^,]*),([^,]*),([^,\(\)]*),([^,\(\)]*)\),?

substitution: {"id":$1,"name":"$2","password":"$3","email":"$4","bday":"$5","tel":"$6","handy":"$7","userlevl":$8,"icq":"$9","aktive":$10,"putzten":$11,"reminder":$12,"punkte_offset":$13},

const Discord = require("discord.js");
const config = require("./auth.json");
const mysql = require("mysql");
const emddb = mysql.createConnection({
    host: config.sqlHost,
    user: config.sqlUser,
    password: config.sqlPass,
    database: config.sqlDB,
    charset: "utf8mb4"
});

const emdbot = new Discord.Client();

var version = "28.03.2017a (beta)";

var draftActive = false;
var initialbans = [];

emdbot.on("ready", () => {
    console.log("Logged in as " + emdbot.user.username + " - " + emdbot.user.id);
});

emdbot.on("message", message => {
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    switch(command[0].toLowerCase()) {
        case "!draftstatus":
            switch(draftActive) {
                case true:
                    message.reply("active.");
                    break;
                case false:
                    message.reply("not active.");
                    break;
            }
            break;
        case "!startdraft":
            if(isCaptain(message)) {
                switch(draftActive) {
                    case true:
                        message.reply("there is already an active draft taking place.");
                        break;
                    case false:
                        message.reply("draft started.");
                        draftActive = true;
                        break;
                }
            } else {
                message.reply("you don't have permission to start a draft because you aren't a captain.");
            }
            break;
        case "!stopdraft":
            if(isCaptain(message)) {
                switch(draftActive) {
                    case true:
                        message.reply("draft stopped.");
                        draftActive = false;
                        break;
                    case false:
                        message.reply("there is no active draft taking place. Start one with `!startdraft`.");
                }
            } else {
                message.reply("you don't have permission to stop drafts because you aren't a captain.");
            }
            break;
        case "!initialban":
            if(isCaptain(message)) {
                switch(draftActive) {
                    case true:
                        if(command[1] == null) {
                            message.reply("you need to specify which hero you want to ban.");
                        } else {
                            emddb.query("SELECT * FROM heroes WHERE hero = ?", [params], function(err, result) {
                                if(result[0] == null) {
                                    message.reply(params + " was not found on the database.");
                                } else {
                                    emddb.query("UPDATE heroes SET available = 0, banned = 1, initialban = 1 WHERE hero = ?", [params], function(err, result) {
                                    message.reply(params + " was added to the initial bans by " + message.author.username + ".");
                                    });
                                }
                            });
                        }
                        break;
                    case false:
                        message.reply("there is no active draft taking place. Start one with `!startdraft`.");
                        break;
                }
            } else {
                message.reply("you don't have permission to ban because you aren't a captain.");
            }
            break;
        case "!initialbans":
            emddb.query("SELECT * FROM heroes WHERE initialban = 1", function(err, result) {
               for(i = 0; i < result.length; i++) {
                   initialbans.push(result[i]["hero"]);
               }
               let initbanlist = initialbans.join();
               message.channel.sendMessage("```xl\n" + initbanlist + "\n```");
               initialbans = []; //we empty the array at the end to prevent duplication of the results in case this command is called again
            });
            break;
        case "!clearinitialbans":
            if(isCaptain(message)) {
                emddb.query("UPDATE heroes SET available = 1, banned = 0, initialban = 0 WHERE initialban = 1");
                message.reply("initial bans have been cleared.");
            } else {
                message.reply("you don't have permission to clear initial bans because you aren't a captain.");
            }
            break;
        case "!version":
            message.channel.sendMessage("Running version: `" + version + "`.");
            break;
//restricted commands
        case "!eval":
            if (message.author.id == config.ownerID) {
                if (command[1] == null) {
                    message.reply ("You have not specified what you want me to evaluate! :(");
                } else {
                    try {
                        var evaled = eval(params);

                        if (typeof evaled !== "string")
                            evaled = require("util").inspect(evaled);
                            message.channel.sendMessage("```xl\n" + clean(evaled) + "\n```");
                    } catch (err) {
                        message.channel.sendMessage("`ERROR` ```xl\n" + clean(err) + "\n```");
                    }
                }
            } else {
                message.reply("lol no :rolling_eyes:");
            }
            break;
        case "!sql":
            if(message.author.id == config.ownerID) { //we lock this command by ID to prevent unauthorized queries
                emddb.query(params, function(err, result) {
                     try {
                         message.channel.sendMessage("```json\n" + JSON.stringify(result) + "\n```");
                     } catch(err) {
                         console.log(err);
                     }
                });
            } else {
                message.reply("lol no :rolling_eyes:");
            }
            break;
    }
});

function clean(text) {
    if (typeof(text) === "string") {
        return text.replace(/` /g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    } else {
        return text;
    }
}

function isCaptain(message) { //core function used throughout the draft process
    return message.member.roles.exists("name", "Captain 1") || message.member.roles.exists("name", "Captain 2");
}

emdbot.login(config.token);

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

var version = "26.03.2017a (beta)";

var draftActive = false;

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
        case "!dbtest": //this is to make sure we are connected to the database
            emddb.query("SELECT * FROM heroes WHERE hero = ?", [params], function(err, result) {
                if(result[0] == null) {
                    console.log("hero does not exist");
                    message.channel.sendMessage(params + " was not found on the database.");
                } else {
                    console.log(result[0]["hero"]);
                    message.channel.sendMessage(result[0]["hero"]);
                }
            });
            break;
        case "!version":
            message.channel.sendMessage("Running version: `" + version + "`.");
            break;
//restricted commands
        case "!eval": //this command is restricted by ID due to its power
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
    }
});

function clean(text) {
    if (typeof(text) === "string") {
        return text.replace(/` /g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    } else {
        return text;
    }
}

function isCaptain(message) { //we use this function to check if the user is a captain
    return message.member.roles.exists("name", "Captain 1") || message.member.roles.exists("name", "Captain 2");
}

emdbot.login(config.token);

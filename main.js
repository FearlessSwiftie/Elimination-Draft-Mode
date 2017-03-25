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

emdbot.on("ready", () => {
    console.log("Logged in as " + emdbot.user.username + " - " + emdbot.user.id);
});

emdbot.on("message", message => {
    var command = message.content.split(" ");
    var params = command.slice(1, command.length).join(" ");

    switch(command[0].toLowerCase()) {
        case "!test":
            emddb.query("SELECT * FROM test WHERE value = ?", [command[1]], function(err, rows) {
                if(rows[0] == null) {
                    console.log("value does not exist");
                } else {
                    console.log(rows[0]['value']);
                }
            });
            break;
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
    }
});

function clean(text) {
    if (typeof(text) === "string") {
        return text.replace(/` /g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    } else {
        return text;
    }
}

function isCaptain(message) {
    return message.member.roles.exists("name", "Captain 1") || message.member.roles.exists("name", "Captain 2");
}

emdbot.login(config.token);

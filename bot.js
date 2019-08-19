const Discord = require('discord.js');
const toArray = require('lodash.toarray');
const { database } = require('./firebase');
var palette = require("google-palette");

const client = new Discord.Client();
const prefix = ".";


const reactRolesQueue = new Set();

client.on('message', async (message) => {
	if (message.author.bot) return;
	if (message.content.indexOf(prefix) != 0) return;

	const [command, ...args] = message.content.slice(prefix.length).split(/ +/g);

	let order;
	switch (command) {
		case 'reactrole':
			if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("تنقصك صلاحيات ادمن لاستخدم هذا الامر")
			if (reactRolesQueue.has(message.guild.id)) return;
			order = args.shift();
			switch (order) {
				case 'add':
					let roleName = args.join(" ");
					let role = message.mentions.roles.first() || message.guild.roles.find(role => role.name == roleName);
					if (!role) return message.channel.send('لا يوجد رول بهذا الاسم');
					reactRolesQueue.add(message.guild.id);
					await message.channel.send("يرجاء وضع رياكشن الان");
					let { reaction, user } = await collectReaction(message.author.id);
					await database.addReactionRole(reaction, role.id);
					reactRolesQueue.delete(message.guild.id)
					reaction.message.react(reaction.emoji.name).catch(O_=>O_)
					break;
				case 'clear':
					await database.clearReactionRoles(message.guild.id);
					message.channel.send("تم مسح جميع رولات الرياكشن بنجاح");
					break;
				default:
					message.channel.send(`${prefix}reactrole <add | clear>`)
					break;
			}
			break;
		case 'colors':
			if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("تنقصك صلاحيات ادمن لاستخدم هذا الامر")
			order = args.shift();
			switch (order) {
				case 'generate':
					let size = args.shift() || 10;
					if (size < 10 || size > 50) return message.channel.send(':exclamation: يمكن ادخال رقم ما بين العشرة والخمسين فقط ');
					let colors = palette('rainbow', size);
					colors.map((color, idx) => {
						setTimeout(() => {
							message.guild.createRole({ name: idx + 1, color, permissions: [] }).catch(console.error);
						}, idx * 200)
					});
					break;
				case 'clear':
					let timer = 0;
					message.guild.roles.filter(role => !isNaN(role.name)).map(role => {
						setTimeout(() => {
							role.delete();
						}, ++timer * 200);
					})
					break;
				default:
					break;
			}
			break;
	}
});



client.on('raw', raw => {
	if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(raw.t)) return;
	var channel = client.channels.get(raw.d.channel_id);
	if (channel.messages.has(raw.d.message_id)) return;
	channel.fetchMessage(raw.d.message_id).then(message => {
		var reaction = message.reactions.get((raw.d.emoji.id ? `${raw.d.emoji.name}:${raw.d.emoji.id}` : raw.d.emoji.name));
		if (raw.t === 'MESSAGE_REACTION_ADD') return client.emit('messageReactionAdd', reaction, client.users.get(raw.d.user_id));
		if (raw.t === 'MESSAGE_REACTION_REMOVE') return client.emit('messageReactionRemove', reaction, client.users.get(raw.d.user_id));
	});
});

function ReactionHandler(reaction, user, userID) {
	return new Promise((resolve, reject) => {
		if (userID == user.id) {
			client.off('messageReactionAdd', ReactionHandler);
			resolve(reaction);
		}
	})
}

function collectReaction(userID) {
	return new Promise((resolve, reject) => {
		client.on('messageReactionAdd', async (reaction, user) => {
			let collected = await ReactionHandler(reaction, user, userID);
			resolve({ reaction: collected, user })
		});
	});
}

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.id == client.user.id) return;
	let reactionRole = await database.getReactionRole(reaction)
	if (!reactionRole) return;
	if (reactionRole.emoji.name != reaction.emoji.name) return reaction.remove(user);
	let role = reaction.message.guild.roles.get(reactionRole.role_id);
	reaction.message.guild.members.get(user.id).addRole(role);
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.id == client.user.id) return;
	let reactionRole = await database.getReactionRole(reaction)
	if (!reactionRole) return;
	let role = reaction.message.guild.roles.get(reactionRole.role_id);
	reaction.message.guild.members.get(user.id).removeRole(role);
});



//مسح رسائل
client.on('message', message => {  
  if (message.author.bot) return; 
  if (message.content.startsWith(prefix + 'clear')) { 
  if(!message.channel.guild) return message.reply(`** This Command For Servers Only**`); 
   if(!message.member.hasPermission('MANAGE_GUILD')) return message.channel.send(`** You don't have Premissions!**`);
   if(!message.guild.member(client.user).hasPermission('MANAGE_GUILD')) return message.channel.send(`**I don't have Permission!**`);
  let args = message.content.split(" ").slice(1)
  let messagecount = parseInt(args);
  if (args > 100) return message.reply(`** The number can't be more than **100** .**`).then(messages => messages.delete(5000))
  if(!messagecount) args = '100';
  message.channel.fetchMessages({limit: messagecount}).then(messages => message.channel.bulkDelete(messages)).then(msgs => {
  message.channel.send(`** Done , Deleted \`${msgs.size}\` messages.**`).then(messages => messages.delete(5000));
  })
}
});

//افتار اي شخص بالعالم

﻿﻿client.on("message", message => {
  if(message.content.startsWith(prefix + "avatar")){
  if(message.author.bot || message.channel.type == "dm") return;
  var args = message.content.split(" ")[1];
  var avt = args || message.author.id;
  client.fetchUser(avt)
  .then((user) => {
  avt = user
  let avtEmbed = new Discord.RichEmbed()
  .setColor("#36393e")
  .setAuthor(`${avt.username}'s Avatar`, message.author.avatarURL)
  .setImage(avt.avatarURL)
  .setFooter(`PrimeBot.`, message.client.user.avatarURL);
  message.channel.send(avtEmbed);
  })
  .catch(() => message.channel.send(`Error`));
  } 
  });


client.on('message', message =>{
  if(message.content.startsWith(prefix + 'add')) {
    let args = message.content.split(" ").slice(1).join(" ");
    if(!args) return message.channel.send('**Please type the emoji ID after the command!**')
    if(args.length < "18" || args.length > "18" || isNaN(args)) return message.channel.send(`**This emoji Can't be Found :x:**`)
    message.guild.createEmoji(`https://cdn.discordapp.com/emojis/${args}.png`, `${args}`).catch(mstry => {
     return message.channel.send(`**This emoji Can't be Found :x:**`)
    })
    message.channel.send(`**Successfully Added The Emoji ✅**`)
  }
})



client.on('message', message => {///////Abdellhadi
const prefix = '!'  ///////Abdellhadi
    if(message.content === prefix + 'creatcolores') {///////Abdellhadi
                         if(!message.channel.guild) return message.channel.send('**This Commnad only For Servers !**');
                         //// حقوق سيرفر كودز
         if(!message.member.hasPermission('ADMINISTRATOR')) return    message.channel.send('**You Dont Have** `ADMINISTRATOR` **premission**').then(msg => msg.delete(6000))
      message.guild.createRole({
                  name: "1",
                    color: "#FFB6C1",///////Abdellhadi
                    permissions: []
     })
           message.guild.createRole({
                  name: "2",
                    color: "#FFC0CB",
                    permissions: []
     })///////Abdellhadi
                message.guild.createRole({
                  name: "3",
                    color: "#FF69B4",///////Abdellhadi
                    permissions: []
     })///////Abdellhadi
                     message.guild.createRole({
                  name: "4",
                    color: "#FF1493",///////Abdellhadi
                    permissions: []
     })
                     message.guild.createRole({
                  name: "5",///////Abdellhadi
                    color: "#DB7093",
                    permissions: []
     })
                     message.guild.createRole({
                  name: "6",
                    color: "#C71585",
                    permissions: []
     })
                     message.guild.createRole({
                  name: "7",///////Abdellhadi
                    color: "#E6E6FA",
                    permissions: []
     })
                     message.guild.createRole({
                  name: "8",
                    color: "#D8BFD8",///////Abdellhadi
                    permissions: []
     })
                     message.guild.createRole({
                  name: "8",
                    color: "#DDA0DD",///////Abdellhadi
                    permissions: []
     })
                     message.guild.createRole({
                  name: "9",
                    color: "#DA70D6",
                    permissions: []
     })
                     message.guild.createRole({
                  name: "10",///////Abdellhadi
                    color: "#EE82EE",
                    permissions: []
     })
                     message.guild.createRole({
                  name: "11",
                    color: "#FF00FF",///////Abdellhadi
                    permissions: []
     })
                     message.guild.createRole({///////Abdellhadi
                  name: "12",
                    color: "#BA55D3",
                    permissions: []///////Abdellhadi
     })
                     message.guild.createRole({///////Abdellhadi
                  name: "13",
                    color: "#9932CC",
                    permissions: []///////Abdellhadi
     })
                          message.guild.createRole({
                  name: "14",
                    color: "#9400D3",///////Abdellhadi
                    permissions: []
     })
                          message.guild.createRole({
                  name: "15",
                    color: "#8A2BE2",
                    permissions: []///////Abdellhadi
     })
                               message.guild.createRole({
                  name: "16",///////Abdellhadi
                    color: "#8B008B",
                    permissions: []
     })///////Abdellhadi
                                    message.guild.createRole({
                  name: "17",
                    color: "#800080",///////Abdellhadi
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "18",
                    color: "#9370DB",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "19",///////Abdellhadi
                    color: "#7B68EE",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "20",
                    color: "#6A5ACD",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "21",
                    color: "#483D8B",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "22",
                    color: "#663399",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "23",
                    color: "#4B0082",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "24",
                    color: "#FFA07A",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "25",
                    color: "#FA8072",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "26",
                    color: "#E9967A",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "27",
                    color: "#F08080",
                    permissions: []
     })///////Abdellhadi
                                    message.guild.createRole({
                  name: "28",
                    color: "#CD5C5C",
                    permissions: []
     })
                                    message.guild.createRole({
                  name: "29",
                    color: "#DC143C",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "30",
                    color: "    #FF0000",
                    permissions: []
     })///////Abdellhadi
                                         message.guild.createRole({
                  name: "31",
                    color: "#B22222",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "32",
                    color: "#8B0000",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "33",
                    color: "#FFA500",
                    permissions: []
     })///////Abdellhadi
                                         message.guild.createRole({
                  name: "34",
                    color: "#FF8C00",
                    permissions: []
     })
                                         message.guild.createRole({///////Abdellhadi
                  name: "35",
                    color: "#FF7F50",
                    permissions: []///////Abdellhadi
     })
                                         message.guild.createRole({///////Abdellhadi
                  name: "36",
                    color: "#FF6347",///////Abdellhadi
                    permissions: []
     })
                                         message.guild.createRole({///////Abdellhadi
                  name: "37",
                    color: "#FF4500",
                    permissions: []///////Abdellhadi
     })
                                         message.guild.createRole({
                  name: "38",///////Abdellhadi
                    color: "#FFD700",///////Abdellhadi
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "39",///////Abdellhadi
                    color: "#FFFFE0",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "40",
                    color: "#FFFACD",///////Abdellhadi
                    permissions: []
     })
                                         message.guild.createRole({///////Abdellhadi
                  name: "41",
                    color: "#FAFAD2",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "42",
                    color: "    #FFEFD5",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "43",
                    color: "#FFE4B5",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "44",
                    color: "#FFDAB9",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "45",
                    color: "#EEE8AA",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "46",
                    color: "#F0E68C",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "47",
                    color: "#BDB76B",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "48",
                    color: "#ADFF2F",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "49",
                    color: "#7FFF00",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "50",
                    color: "#7CFC00",
                    permissions: []
     })
                                         message.guild.createRole({
                  name: "51",
                    color: "#00FF00",
                    permissions: []
     })  
     
                                         message.guild.createRole({
                  name: "52",
                    color: "#32CD32",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "53",
                    color: "#98FB98",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "54",
                    color: "#90EE90",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "55",
                    color: "#00FA9A",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "56",
                    color: "#00FF7F",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "57",
                    color: "#3CB371",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "58",
                    color: "#2E8B57",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "59",
                    color: "#2E8B57",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "60",
                    color: "#008000",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "61",
                    color: "#006400",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "62",
                    color: "#9ACD32",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "63",
                    color: "#6B8E23",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "64",
                    color: "#556B2F",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "65",
                    color: "#66CDAA",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "66",
                    color: "#8FBC8F",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "67",
                    color: "#20B2AA",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "68",
                    color: "#008B8B",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "69",
                    color: "#008080",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "70",
                    color: "#00FFFF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "71",
                    color: "#E0FFFF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "72",
                    color: "#AFEEEE",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "73",
                    color: "#7FFFD4",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "74",
                    color: "#40E0D0",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "75",
                    color: "#48D1CC",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "76",
                    color: "#00CED1",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "77",
                    color: "#5F9EA0",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "78",
                    color: "#4682B4",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "79",
                    color: "#B0C4DE",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "80",
                    color: "#ADD8E6",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "81",
                    color: "#B0E0E6",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "82",
                    color: "#87CEFA",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "83",
                    color: "#87CEEB",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "84",
                    color: "#6495ED",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "85",
                    color: "#00BFFF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "86",
                    color: "#1E90FF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "87",
                    color: "#4169E1",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "88",
                    color: "#0000FF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "89",
                    color: "#0000CD",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "90",
                    color: "#00008B",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "91",
                    color: "#000080",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "92",
                    color: "#191970",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "93",
                    color: "#FFF8DC",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "94",
                    color: "#FFEBCD",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "95",
                    color: "#FFE4C4",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "96",
                    color: "#FFDEAD",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "97",
                    color: "#F5DEB3",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "98",
                    color: "#DEB887",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "99",
                    color: "#D2B48C",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "100",
                    color: "#BC8F8F",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "101",
                    color: "#F4A460",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "102",
                    color: "#DAA520",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "103",
                    color: "#B8860B",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "104",
                    color: "#CD853F",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "105",
                    color: "#D2691E",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "106",
                    color: "#808000",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "107",
                    color: "#8B4513",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "108",
                    color: "#A0522D",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "109",
                    color: "#A52A2A",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "110",
                    color: "#800000",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "111",
                    color: "#FFFFFF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "112",
                    color: "#FFFAFA",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "113",
                    color: "#F0FFF0",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "114",
                    color: "#F5FFFA",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "115",
                    color: "#F0FFFF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "116",
                    color: "#F0F8FF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "117",
                    color: "#F8F8FF",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "118",
                    color: "#F5F5F5",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "119",
                    color: "#FFF5EE",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "120",
                    color: "#F5F5DC",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "121",
                    color: "#FDF5E6",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "122",
                    color: "#FFFAF0",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "123",
                    color: "#FFFFF0",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "124",
                    color: "#FAEBD7",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "125",
                    color: "#FAF0E6",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "126",
                    color: "#FFF0F5",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "127",
                    color: "#FFE4E1",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "128",
                    color: "#DCDCDC",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "129",
                    color: "#D3D3D3",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "130",
                    color: "#C0C0C0",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "131",
                    color: "#A9A9A9",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "132",
                    color: "#696969",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "133",
                    color: "#808080",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "134",
                    color: "#778899",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "135",
                    color: "#708090",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "136",
                    color: "#2F4F4F",
                    permissions: []
     })    
                                         message.guild.createRole({
                  name: "137",
                    color: "#000000",
                    permissions: []
     })    
 
     
          message.channel.sendMessage({embed: new Discord.RichEmbed()
     .setColor('#502faf').setAuthor(`${message.author.username}'`, message.author.avatarURL).setDescription('``الالوان قيد الانشاء ....``')});
   }
    });




client.login(process.env.BOT_TOKEN);

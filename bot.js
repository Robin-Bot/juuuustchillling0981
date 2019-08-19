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
					if (size < 10 || size > 50) return message.channel.send('يمكن ادخال رقم ما بين العشرة والخمسين فقط');
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




client.login(prcess.env.BOT_TOKEN);

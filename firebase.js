const admin = require('firebase-admin');
const toArray = require('lodash.toarray');

const dotenv = require('dotenv');
dotenv.config();

admin.initializeApp({
    credential: admin.credential.cert({
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: "https://axel-db9a0.firebaseio.com/"
})


module.exports.database = new class {
    constructor() {
        this.database = admin.database();
    }

    addReactionRole(reaction, role_id) {
        return new Promise((resolve, reject) => {
            let data = {
                role_id,
                emoji: {
                    name: reaction.emoji.name,
                    id: reaction.emoji.id
                },
                message_id: reaction.message.id
            }
            resolve(this.database.ref(`/${reaction.message.guild.id}/reaction_roles`).push(data));
        })
    }

    getReactionRole(reaction) { 
        return new Promise((resolve, reject) => {
            this.database.ref(`/${reaction.message.guild.id}/reaction_roles`).once("value", (snapshot) => {
                let reactionRoles = toArray(snapshot.val());
                let reactionRole = reactionRoles.find(role => {
                    return (
                            (role.message_id == reaction.message.id) &&
                            role.emoji.id ? 
                            (role.emoji.id == reaction.emoji.id) : 
                            (role.emoji.name == reaction.emoji.name)
                        );
                })
                resolve(reactionRole);
            })
        })
    }

    clearReactionRoles (guildID) {
        return new Promise((resolve, reject) => {
            resolve(this.database.ref(`/${guildID}}/reaction_roles`).remove());      
        });
    }
}

const { Client, MessageEmbed, MessageAttachment, Message } = require('discord.js');
const t = require('./topics.js');
const c = require('./cards.js');
const bot = new Client();
const token = 'TOKEN';
const Prefix = '$';
const fs = require('fs');
const { createCanvas, registerFont, measureText } = require('canvas');

const width = 600;
const height = 1000;

let cards = c.cards;

let topiccards = t.topiccards;

console.log(`Cards: ${cards.length} Topics: ${topiccards.length}`);

let players;
let channel;
let selected;
let ongoingGame = false;
let r1 = true;

bot.on('ready', () => { 
    console.log('Bot online');
});

bot.on('message', message => {
    
    let args = message.content.substring(Prefix.length).split(" ");
    if (!message.content.startsWith(Prefix)) {
        return;
    }

    switch(args[0]) {
        case 'hand':
            players.forEach(player => {
                console.log(player.getHand);
            })
            break;
        case 'info':
            const Embed = new MessageEmbed()
                .setTitle('CAH Bot Info:')
                .setColor('BLACK')
                .addFields(
                    { name: 'The Game:', value: 'Each round there is a random topic. Each player selects one card from their hand to respond to the topic. The judge will then pick the best card and that player will gwt one point.' },
                    { name: 'The Bot:', value: 'To play CAH with this bot, assemble your party into a vc and type **$play** in a channel. The game will then run until you type **$end**, which will end the game and show the point values of each player.'},
                    { name: 'CAH Bot commands:', value: '$play\n$end\n$info'}
                )
            message.channel.send(Embed);
            break;
        case 'play':
            if (message.member.voice.channel && !ongoingGame) {
                ongoingGame = true;
                r1 = true;
                playgame(message);
                selected = new Array();
            } 
            else {
                message.reply(' you must be in a vc with everyone who wants to play to use this command or a game is already in progress.')
            }
            break;
        
        case 'end': 
            if (ongoingGame) {
                ongoingGame = false;
                sortByPoints();
                const Embed2 = new MessageEmbed()
                    .setTitle('Rankings:')
                    .setColor('BLACK')
                players.forEach(player => {
                    let n = player.getMember.user.tag.split('#')[0];
                    if (player.getMember.nickname != undefined) {
                        n = player.getMember.nickname;
                    }
                    Embed2.addField(`${n}:`, '' + player.getPoints)
                });
                channel.send(Embed2);
                players = new Array();
                selected = new Array();
            }
    }
});

bot.on('messageReactionAdd', (messageReaction, user) => {
    if(user.bot)  return;
    const { message, emoji } = messageReaction;

    if (message.channel.type === 'dm' && ongoingGame) {
        let m = bot.guilds.cache.get('816706810059948052').members.cache.get(user.id);
        let player = findPlayer(m);
        let hand = player.getHand;
        console.log(hand);
        if (message.content != undefined && !player.card && !player.judge) { 
            //checks valid cards
            console.log('pass 1');
            if (hand != undefined && hand.indexOf(message.content.split(',')[1]) != -1 && emoji.name == '✅') { 
                message.delete();
                let index = hand.indexOf(message.content.split(',')[1]);
                let h = hand.splice(index, 1);
                player.changeHand(hand);
                player.setCard(true);
                channel.send(sendCard(message.content.split(',')[1], 'white'));
                players.forEach(player7 => {
                    if (!player7.judge) {
                        player7.getMember.send(sendCard(message.content.split(',')[1], 'white')); 
                    }
                });
                findJudge().getMember.send(`||,${message.content.split(',')[1]},${user.id},||`, sendCard(message.content.split(',')[1], 'white')).then(embed => {
                    embed.react('🏆');
                });
                selected.push(message.content.split(',')[1]);
                //add if here to send sleced only when full
            }
            if (emoji.name == '🏆' && selected.indexOf(message.content.split(',')[1]) != -1) {
                let mem = bot.guilds.cache.get('816706810059948052').members.cache.get(message.content.split(',')[2]);
                findPlayer(mem).addPoint();
                let a = sendCard(message.content.split(',')[1], 'white');
                channel.send('**The winner is:**', a);
                players.forEach(player8 => {
                    if (!player8.judge) {
                        player8.getMember.send('**The winner is:**', a);
                    }
                });
                selected = new Array();
                newRound();
            }
        }
    }   
});


function playgame(message) {
    players = new Array();
    channel = message.channel;
    message.member.voice.channel.members.forEach(member => add_players(member));
    let topic = topiccards[Math.trunc(Math.random() * topiccards.length)];
    console.log(topic);
    let rand = Math.trunc(Math.random() * players.length);
    judge = players[rand];
    players[rand].setJudge(true);
    channel.send(sendCard(topic, 'black'));
    players.forEach(player => {
        player.getMember.send(sendCard(topic, 'black'));
    })
    players.forEach(player => pick_hand(player));

}

function newRound() {
    r1 = false;
    players.forEach(player => {
        player.setJudge(false);
        player.setCard(false);
    });
    let topic = topiccards[Math.trunc(Math.random() * topiccards.length)];
    console.log(topic);
    channel.send(sendCard(topic, 'black'));
    players.forEach(player => {
        player.getMember.send(sendCard(topic, 'black'));
    });
    let rand = Math.trunc(Math.random() * players.length);
    judge = players[rand];
    players[rand].setJudge(true);
    players.forEach(player => pick_hand(player));
}

function add_players(member) {
    let player1 = new Player(member);
    players.push(player1);
}

async function pick_hand(player2) { 
    if (!player2.judge) {
        let hand = player2.getHand;  
        let m = player2.getMember;
        m.send('**------------------------------------------------------------------**').then(async () => {
            if (r1 || hand == undefined) {  
                hand = new Array();
                for (var i = 0; i < 7; i++) {
                    let card = cards[Math.trunc(Math.random() * cards.length)];
                    if (hand.indexOf(card) == -1) {
                        hand.push(card);
                        m.send(`||,${card},||`, sendCard(card, 'white')).then(sentEmbed => {
                            sentEmbed.react('✅');
                        });
                        await sleep(200);
                    }
                    else {
                        i--;
                    }
                }
                player2.changeHand(hand);
                m.send('**------------------------------------------------------------------**');
            }
            else {
                hand = player2.getHand;
                let card2 = cards[Math.trunc(Math.random() * cards.length)];
                hand.push(card2);
                player2.changeHand(hand);
                hand.forEach(card => {
                    m.send(`||,${card},||`, sendCard(card, 'white')).then(sentEmbed => {
                        sentEmbed.react('✅');
                    });
                })
                m.send('**------------------------------------------------------------------**');
            }
        })
    }     
}

function showPlayers() {
    players.forEach(player4 => {
        console.log(player4);
    });
}

function findPlayer(user) {
    let find;
    players.forEach(player3 => { 
        if (player3.getMember.id == user.id) {
            find = player3;
        }
    });
    return find;
}

function findJudge() {
    let find;
    players.forEach(player => {
        if (player.judge) {
            find = player;
        } 
    });
    return find;
}

function sortByPoints() {
    players.sort(function(a, b) {
        return b.getPoints - a.getPoints;    
    });
}

function sendCard(topic, color) {
    const canvas = createCanvas(width, height);
    registerFont('./FreeSansBold.ttf', { family: 'Free Sans Bold' });
    const context = canvas.getContext('2d');

    context.fillStyle = color;
    context.fillRect(0, 0, width, height);

    let text = getLines(context, topic, 67);

    context.font = '70px "Free Sans Bold"';
    context.textAlign = 'center';
    context.fillStyle = 'white';
    if (color == 'white') {
        context.fillStyle = 'black';
    }

    let ct = 1;
    text.forEach(line => {
        context.fillText(line, 300, 50 + (ct * 100), 500);
        ct++;
    })
    context.font = '30px "Free Sans Bold"';
    context.fillText('CAH Bot by marbeville#8215', 300, 970, 500);

    return new MessageAttachment(canvas.toBuffer(), 'card-image.png');
}

function getLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width2 = ctx.measureText(currentLine + " " + word).width;
        if (width2 < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

class Player {
    constructor(member, hand) {
        this.member = member;
        this.points = 0;
        this.isJudge = false;
        this.hand = hand;
        this._card = false;
    }

    get getHand() {
        return this.hand;
    }

    get getPoints() {
        return this.points;
    }

    get getMember() {
        return this.member;
    }

    get judge() {
        return this.isJudge;
    }

    get card() {
        return this._card;
    }

    setCard(c3) {
        this._card = c3;
    }

    addPoint() {
        this.points++;
    }

    setJudge(value) {
        this.isJudge = value;
    }

    changeHand(h) {
        this.hand = h;
    }
}

bot.login(token);

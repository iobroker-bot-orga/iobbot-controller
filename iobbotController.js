#!/usr/bin/env node
'use strict';

const {parseArgs} = require('node:util');
const axios = require('axios');

//const common = require('./lib/commonTools.js');
const github = require('./lib/githubTools.js');
//const iobroker = require('./lib/iobrokerTools.js');

const opts = {
    debug: false,
}

function debug (text){
    if (opts.debug) {
        console.log(`[DEBUG] ${text}`);
    }
}

function triggerRepoCheck(owner, adapter, flag) {
    const url = `${owner}/${adapter} ${flag}`;
    debug(`trigger rep checker for ${url}`+ ((opts.dry)?'[DRY RUN]':''));
    if (opts.dry) return;

    // curl -L -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer ghp_xxxxxxxx" https://api.github.com/repos/iobroker-bot-orga/check-tasks/dispatches -d "{\"event_type\": \"check-repository\", \"client_payload\": {\"url\": \"mcm1957/iobroker.weblate-test\"}}"
    return axios.post(`https://api.github.com/repos/iobroker-bot-orga/check-tasks/dispatches`, {"event_type": "check-repository", "client_payload": {"url": url}},
        {
            headers: {
                Authorization: `bearer ${process.env.IOBBOT_GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
                'user-agent': 'Action script'
            },
        })
        .then(response => response.data)
        .catch(e => console.error(e));
}

async function executeHelp( notification, id ) {

    let text = '';
    text = text + 'Thanks for contacting me.  \n';
    text = text + 'I will try to explain my possibilities. Currently I understand the following commands: \n';
    text = text + '  \n';
    text = text + '- recheck  \n';
    text = text + '  I will perform a new repository check and update or close my issue containing the results.  \n';
    text = text + '- recreate  \n';
    text = text + '  I will perform a new repository check and recreate or close my issue containing the results.  \n';
    text = text + '  \n';
    text = text + '- help  \n';
    text = text + '  I will list all commands I understand at a new comment.  \n';
    text = text + '_your_  \n';
    text = text + '_ioBroker Check and Service Bot_  \n';

    await github.addComment( notification.repository.owner.login, notification.repository.name, id, text );
}

async function executeReCheck( notification, id ) {

    // let text = '';
    // text = text + 'Thanks for contacting me.  \n';
    // text = text + 'I received your request to recheck this repository. I will start doing my work soon.  \n';
    // text = text + '  \n';
    // text = text + 'Thanks for spending your time and working at an ioBroker adapter.  \n';
    // text = text + '  \n';
    // text = text + '_your_  \n';
    // text = text + '_ioBroker Check and Service Bot_  \n';

    // await github.addComment( notification.repository.owner.login, notification.repository.name, id, text );

    triggerRepoCheck( notification.repository.owner.login, notification.repository.name, '--recheck' );
}

async function executeReCreate( notification, id ) {

    let text = '';
    text = text + 'Thanks for contacting me.  \n';
    text = text + 'I received your request to recheck this repository and to recreate the checker issue. I will start doing my work soon.\n';
    text = text + 'I will close an existing issue and create a new one if any issues are to be reported.  \n';
    text = text + '  \n';
    text = text + 'Thanks for spending your time and working at an ioBroker adapter.  \n';
    text = text + '  \n';
    text = text + '_your_  \n';
    text = text + '_ioBroker Check and Service Bot_  \n';

    await github.addComment( notification.repository.owner.login, notification.repository.name, id, text );

    triggerRepoCheck( notification.repository.owner.login, notification.repository.name, '--recreate' );
}

async function executeUnknown( notification, id, cmd ) {

    let text = '';
    text = text + 'Thanks for contacting me.  \n';
    text = text + '  \n';
    text = text + `I\'m sorry, I do not understand your command **${cmd}**. \n`;
    text = text + '  \n';
    text = text + 'You can query my capabilities by specifying:  \n';
    text = text + '  \n';
    text = text + '\`@iobroker-bot help\`\n';
    text = text + '  \n';
    text = text + '_your_  \n';
    text = text + '_ioBroker Check and Service Bot_  \n';
    
    await github.addComment( notification.repository.owner.login, notification.repository.name, id, text );
}

async function addThanksALot( notification, id ) {

    let text = '';
    text = text + 'Thanks for processing and closing this issue.   \n';
    text = text + '  \n';
    text = text + `I will recheck for new issues later. So it\'s no problem if this issue has been closed premature. \n`;
    text = text + '  \n';
    text = text + 'You may start a new check at any time by adding the following comment to this issue:  \n';
    text = text + '  \n';
    text = text + '\`@iobroker-bot recheck\`\n';
    text = text + '  \n';
    text = text + 'Please note that I (and the server at GitHub) have always plenty of work to do. So it may last up to 30 minutes until you see a reaction. I will drop a comment here as soon as I start processing. \n';
    text = text + '  \n';
    text = text + 'Feel free to contact me (@iobroker-bot) if you have any questions or feel that an issue is incorrectly flagged.  ';
    text = text + '_Let\'s work together for the best user experience._';
    text = text + '  \n';
    text = text + '_your_  \n';
    text = text + '_ioBroker Check and Service Bot_  \n';
    
    await github.addComment( notification.repository.owner.login, notification.repository.name, id, text );

    //triggerRepoCheck( notification.repository.owner.login, notification.repository.name, '--erroronly' );
}

async function processIssue( notification, id ) {
    console.log (`[INFO] Url:   ${notification.subject.url.replace('https://api.github.com/repos','https://www.github.com')}`);
    console.log (`[INFO] Title: ${notification.subject.title}`);

    const issue = await github.getGithub( notification.subject.url )
    debug(`ISSUE: ${JSON.stringify(issue)}`);

    if (issue.comments) {
        const comments = await github.getAllComments(notification.repository.owner.login, notification.repository.name, issue.number);

        console.log( `[INFO] issue ${issue.number} has ${comments.length} comment(s)`);
    
        for (const comment of comments) {
            debug(`COMMENT: ${JSON.stringify(comment)}`);
            debug(`COMMENT: ${comment.body}`)
            
            let cmd = '';
            if (comment.body) {
                let m;
                m = comment.body.match(/^\s*@iobroker-bot\s+(\w+)\s*$/i);
                if (m) {
                    cmd = m[1];
                } else {
                    m = comment.body.match(/^\s*RE-CHECK!\s*$/i);
                    if (m) {
                        cmd = 'RE-CHECK';
                    }
                }
            }   

            if (cmd) {
                cmd = cmd.toUpperCase();
                if (comment.reactions.eyes)  {            
                    console.log(`[INFO] ${cmd} detected at ${notification.repository.owner.login}/${notification.repository.name} was already processed`);
                    continue; // looks like I was here already
                }
                
                console.log(`[INFO] ${cmd} detected at ${notification.repository.owner.login}/${notification.repository.name}`);
                await github.addCommentReaction( notification.repository.owner.login, notification.repository.name, comment.id, "eyes" );
        
                if (cmd === 'RE-CHECK') {
                    await executeReCheck( notification, issue.number);
                } else if (cmd === 'RECHECK') {
                    await executeReCheck( notification, issue.number);
                } else if (cmd === 'RECREATE') {
                    await executeReCreate( notification, issue.number);
                } else if (cmd === 'HELP') {
                    await executeHelp( notification, issue.number);
                } else {
                    console.log(`[WARNING] ${cmd} cannot be recognized.`);
                    await executeUnknown(notification, issue.number, cmd);
                }
            }        
        }
    } else {
        console.log( `[INFO] issue ${issue.number} has NO comment(s) attached`);
    }
    
    if (issue.state ==='closed' && issue.title.includes('Please consider fixing issues detected by repository checker')) {
        let addThanks = true;

        if (issue.comments) {
            const comments = await github.getAllComments(notification.repository.owner.login, notification.repository.name, issue.number);
            for (const comment of comments) {
                debug(`COMMENT: ${comment.body}`)
                if (comment.user.login === 'ioBroker-Bot' && comment.body.includes('Thanks for processing and closing this issue.')) {
                    addThanks = false;
                }
                if (comment.user.login === 'ioBroker-Bot' && comment.body.includes('All issues reported earlier seem to be fixed now.')) {
                    addThanks = false;
                }
            }
        }
        
        if (addThanks) {
            console.log( `[INFO] issue ${issue.number} has been closed, let's say thank you.`);
            await addThanksALot( notification, issue.number );
        } else {
            console.log( `[INFO] issue ${issue.number} is closed and has been commented by ioBroker-Bot already`);
        }
    }
};

async function processNotification(notification) {

//if (notification.repository.name != 'ioBroker.snmp') return;

    if (!notification.subject) {
        console.log(`[WARNING] notification for ${notification.repository.owner.login}/${notification.repository.name} does not contain subject` );
        return;
    }

    const threadId = notification.url.split('/').pop();
    //debug( `notification url: ${notification.url} / thread Id: ${threadId}`);

    console.log('');
    if (notification.subject.type === 'Issue') {
        console.log(`[INFO] notification with type 'ISSUE' encountered at ${notification.repository.owner.login}/${notification.repository.name}`);
        await processIssue( notification );
    } else{
        console.log(`[INFO] notification with type ${notification.subject.type} encountered at ${notification.repository.owner.login}/${notification.repository.name} but ignored`);
    }
    await github.markNotificationDone( threadId );
    console.log(`[INFO] notification marked as completed`);
    
}


async function main() {
    const options = {
        'debug': {
            type: 'boolean',
            short: 'd',
        },
    };

    const {
        values,
        positionals,
            } = parseArgs({ options, strict:true, allowPositionals:true,  });

    //console.log(values, positionals);

    opts.debug = values['debug'];

    //if (positionals.length != 1) {
    //    console.log ('[ERROR] Please specify exactly one repository');
    //    process.exit (1);
    //}

    const notifications = await github.getNotifications();
    console.log (`[INFO] ${notifications.length} notification(s) detected`);

    for (const notification of notifications) {
        notification && await processNotification(notification);
    };
}

process.env.OWN_GITHUB_TOKEN = process.env.IOBBOT_GITHUB_TOKEN;
console.log (`[INFO] ioBroker-Bot controller started`);
main();

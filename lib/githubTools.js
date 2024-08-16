#!/usr/bin/env node

const axios = require('axios');

axios.defaults.headers = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Authorization': process.env.IOBBOT_GITHUB_TOKEN ? `token ${process.env.IOBBOT_GITHUB_TOKEN}` : 'none',
    'user-agent': 'Action script'
};

async function getGithub(githubUrl, raw, noError) {
    const options = {
        headers: {
            Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
            'user-agent': 'Action script'
        },
    };
    if (!process.env.OWN_GITHUB_TOKEN) {
        delete options.headers.Authorization;
    }
    if (raw) {
        options.transformResponse = [];
    }

    try {
        const response = await axios(githubUrl, options);
        return response.data;
    } catch (e) {
        !noError && console.error(`Cannot get ${githubUrl}`);
        throw e;
    }
}

/*
async function downloadFile(path, binary, noError) {
    console.log(`Download ${context.githubUrl}${path || ''}`);

    if (!context.init) throw ('Github tools not yet initialized');

    const options = {};
    if (binary) {
        options.responseType = 'arraybuffer';
    }

    try {
        const response = await axios(context.githubUrl + (path || ''), options);
        return response.data;
    } catch (e) {
        !noError && console.error(`Cannot download ${context.githubUrl}${path || ''}`);
        throw e;
    }
}
*/

async function addComment(owner, repository, id, body) {
    try {
        const _response = await axios.post(`https://api.github.com/repos/${owner}/${repository}/issues/${id}/comments`, {body}, {
            headers: {
                Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
                'user-agent': 'Action script'
            }
        });
        return _response.data;
    } catch (e) {
        console.error(`error adding comment`);
        throw e;
    }
}

async function getAllComments(owner, repository, id) {
    ///repos/:owner/:repo/issues/:issue_number/comments
    try {
        const _response = await axios(`https://api.github.com/repos/${owner}/${repository}/issues/${id}/comments?per_page=100`, {
            headers: {
                Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
                'user-agent': 'Action script'
            }
        });
        return _response.data;
    } catch (e) {
        console.error(`error adding comment`);
        throw e;
    }
}

function deleteComment(prID, commentID) {
///repos/:owner/:repo/issues/:issue_number/comments
    return axios.delete(`https://api.github.com/repos/ioBroker/ioBroker.repositories/issues/comments/${commentID}`, {
        headers: {
            Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
            'user-agent': 'Action script'
        }
    })
        .then(response => response.data);
}

async function addCommentReaction(owner, repository, commentID, reaction) {
    try {
        const _response = await axios.post(`https://api.github.com/repos/${owner}/${repository}/issues/comments/${commentID}/reactions`, 
            {"content":`${reaction}`}, {
            headers: {
                Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
                'user-agent': 'Action script'
            }
        });
        return _response.data;
    } catch (e) {
        console.error(`error adding comment reaction`);
        throw e;
    }
}

function createIssue(owner, repository, json) {
    /*
    {
      "title": "Found a bug",
      "body": "I'm having a problem with this.",
      "assignees": [
        "octocat"
      ],
      "milestone": 1,
      "labels": [
        "bug"
      ]
    }
*/
    return axios.post(`https://api.github.com/repos/${owner}/${repository}/issues`, json, {
        headers: {
            Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
            'user-agent': 'Action script'
        },
    })
        .then(response => response.data);
}

async function getAllIssues(owner, repository) {
    let issues = await getGithub(`https://api.github.com/repos/${owner}/${repository}/issues`);
    return issues
}

async function closeIssue(owner, adapter, id) {
    try {
        const _response = await axios.patch(`https://api.github.com/repos/${owner}/${adapter}/issues/${id}`,
                {
                    'state' : 'close'
                },
                {
                    headers: {
                        Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
                        'user-agent': 'Action script'
                    },
                });
        return _response.data;
    } catch (e) {
        console.error(`error closing issue`);
        throw e;
    }
}

async function getIssue(owner, adapter, id) {
    try {
        const _response = await axios(`https://api.github.com/repos/${owner}/${adapter}/issues/${id}`,
                {
                    headers: {
                        Authorization: process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
                        'user-agent': 'Action script'
                    },
                });
        return _response.data;
    } catch (e) {
        console.error(`error closing issue`);
        throw e;
    }
}

async function getNotifications() {
    //curl -L \
    //-H "Accept: application/vnd.github+json" \
    //-H "Authorization: Bearer <YOUR-TOKEN>" \
    //-H "X-GitHub-Api-Version: 2022-11-28" \
    // https://api.github.com/notifications    
    let responseData = [];
    try {
        let ii = 0;
        while (true) {
            ii++;
            const _response = await axios(`https://api.github.com/notifications?page=${ii}`, {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
                    'user-agent': 'Action script'
                }
            });
            if (!_response.data || !_response.data.length) break;
            responseData = responseData.concat(_response.data);
        }
    } catch (e) {
        console.error(`error getting notifications`);
        throw e;
    }

    //console.log (JSON.stringify(responseData));
    return responseData;
}

async function markNotificationDone(id) {
    //curl -L \
    //-X DELETE \
    //-H "Accept: application/vnd.github+json" \
    //-H "Authorization: Bearer <YOUR-TOKEN>" \
    //-H "X-GitHub-Api-Version: 2022-11-28" \
    //https://api.github.com/notifications/threads/THREAD_ID
    try {
        const _response = await axios.delete(`https://api.github.com/notifications/threads/${id}`, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': process.env.OWN_GITHUB_TOKEN ? `token ${process.env.OWN_GITHUB_TOKEN}` : 'none',
                'user-agent': 'Action script'
            }
        });
        responseData = _response.data;
    } catch (e) {
        console.error(`error marking notification tthread ${id} as done`);
        throw e;
    }

    //console.log (JSON.stringify(responseData));
    return responseData;
}

//exports.downloadFile = downloadFile;
exports.getGithub = getGithub;
exports.addComment = addComment;
exports.deleteComment = deleteComment;
exports.getAllComments = getAllComments;
exports.addCommentReaction = addCommentReaction;
exports.createIssue = createIssue;
exports.getAllIssues = getAllIssues;
exports.closeIssue = closeIssue;
exports.getIssue = getIssue;
exports.getNotifications = getNotifications;
exports.markNotificationDone = markNotificationDone;


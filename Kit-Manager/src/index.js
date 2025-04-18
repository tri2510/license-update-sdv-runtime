const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const config = require('../configs');
const convertPgCode = require('./convert_code');
const cors = require('cors')

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    cors: {
        origin: '*',
    }
});

let KITS = new Map()
let CLIENTS = new Map()
let SYNCER_HW = new Map()

// setInterval(() => {
//     console.log(`KITS: ${KITS.size}`)
//     KITS.forEach((kit, kit_id) => {
//         console.log(`Kit ${kit_id} is online: ${kit.is_online}`)
//     })

//     console.log(`CLIENTS: ${CLIENTS.size}`)
//     CLIENTS.forEach((client, client_id) => {
//         console.log(`Client ${client_id} is online: ${client.is_online}`)
//     })
// }, 3000)

app.use(cors({
    origin: '*'
}));

app.get('/listAllKits', (req, res) => {
    return res.json({
        status: "OK",
        message: "List all kits",
        content: Array.from(KITS.values())
    })
});

app.get('/listAllClient', (req, res) => {
    return res.json({
        status: "OK",
        message: "List all clients",
        content: Array.from(CLIENTS.values())
    })
});

function announceListOfKit() {
    CLIENTS.forEach((client, client_id) => {
        io.to(client_id).emit('list-all-kits-result', Array.from(KITS.values()))
    })
}

function announceListOfHw() {
    CLIENTS.forEach((client, client_id) => {
        io.to(client_id).emit('list-all-hw-result', Array.from(SYNCER_HW.values()))
    })
}

io.on('connection', (socket) => {
    /**
     * Register a kit
     */
    socket.on('register_kit', (payload) => {
        if(!payload || !payload.kit_id) return;
        KITS.set(payload.kit_id, {
            socket_id: socket.id,
            kit_id: payload.kit_id,
            name: payload.name || '',
            last_seen: new Date().getTime(),
            is_online: true,
            support_apis: payload.support_apis || [],
            desc: payload.desc || '',
        })
        announceListOfKit()
    })

    socket.on('register_hw_kit', (payload) => {
        if(!payload || !payload.kit_id) return;
        SYNCER_HW.set(payload.kit_id, {
            socket_id: socket.id,
            kit_id: payload.kit_id,
            name: payload.name || '',
            last_seen: new Date().getTime(),
            is_online: true,
            support_apis: payload.support_apis || [],
            desc: payload.desc || '',
        })
    })

    /**
     * Register a client
     */
    socket.on('register_client', (payload) => {
        if(!payload) return;
        CLIENTS.set(socket.id, {
            username: payload.username,
            user_id: payload.user_id,
            domain: payload.domain,
            last_seen: new Date().getTime(),
            is_online: true,
        })
        socket.emit('list-all-kits-result', Array.from(KITS.values()))
        socket.emit('list-all-hw-result', Array.from(SYNCER_HW.values()))
    });

    socket.on('unregister_client', (payload) => {
        let existClient = CLIENTS.get(socket.id)
        if(existClient) {
            CLIENTS.delete(socket.id)
        }
    });

    socket.on('clientSubscribeToKit', (payload) => {
        if(!payload || !payload.kit_id) return;
        socket.join(payload.kit_id)
    });

    socket.on('clientUnsubscribeToKit', (payload) => {
        if(!payload || !payload.kit_id) return;
        socket.leave(payload.kit_id)
    });


    socket.on('list-all-kits', () => {
        socket.emit('list-all-kits-result', Array.from(KITS.values()))
    });

    socket.on('list-all-syncer_hw', () => {
        socket.emit('list-all-hw-result', Array.from(SYNCER_HW.values()))
    });

    /**
     * Handle disconnection
     */
     socket.on('disconnect', () => {
        // --------------------------------------------
        let existKit = Array.from(KITS.values()).find(kit => kit.socket_id == socket.id)
        if(existKit) {
            existKit.is_online = false
            existKit.last_seen = new Date().getTime()
            KITS.delete(existKit.kit_id)
            announceListOfKit()
        }
        //---------------------------------------------
        let existSyncerHW = Array.from(SYNCER_HW.values()).find(hw => hw.socket_id == socket.id)
        if(existSyncerHW) {
            existSyncerHW.is_online = false
            existSyncerHW.last_seen = new Date().getTime()
            announceListOfHw()
        }
        // --------------------------------------------
        let existClient = CLIENTS.get(socket.id)
        if(existClient) {
            CLIENTS.delete(socket.id)
        }
    });

    // ------------ MESSAGE FROM CLIENT TO KIT ----------------
    socket.on('messageToKit', async (payload) => {
        if(!payload || !payload.cmd || !payload.to_kit_id) return;
        let kit = KITS.get(payload.to_kit_id)
        if(kit) {
            if(["deploy_request", "deploy_n_run"].includes(payload.cmd)) {
                // console.log(payload)
                let convertedCode = await convertPgCode(payload.prototype?.name || 'App', payload.code || '')
                // console.log(`convertedCode`)
                // console.log(convertedCode)
                io.to(kit.socket_id).emit('messageToKit', {
                    request_from: socket.id,
                    ...payload,
                    convertedCode: convertedCode
                })
            } else {
                io.to(kit.socket_id).emit('messageToKit', {
                    request_from: socket.id,
                    ...payload
                })
            }
        }
    })
    socket.on('messageToKit-kitReply', (payload) => {
        if(!payload || !payload.request_from) return;
        io.to(payload.request_from).emit('messageToKit-kitReply', payload)
    })

    // ------------ MESSAGE FROM KIT TO CLIENT ----------------
    socket.on('broadcastToClient', (payload) => {
        if(!payload || !payload.cmd || payload.kit_id) return;
        let kit = KITS.get(payload.kit_id)
        if(kit && kit.socket_id == socket.id) {
            io.to(payload.kit_id).emit('broadcastToClient', payload) 
        }
    })

    // ------------ MESSAGE FROM CLIENT TO KIT ----------------
    socket.on('messageToSyncerHw', (payload) => {
        if(!payload || !payload.cmd || !payload.to_kit_id) return;
        if(payload.cmd == 'syncer_set') {
            let kit = SYNCER_HW.get(payload.to_kit_id)
            if(kit) {
                io.to(kit.socket_id).emit('messageToSyncerHw', {
                    request_from: socket.id,
                    ...payload
                })
            }
        }
    })
    socket.on('messageToSyncerHw-kitReply', (payload) => {
        if(!payload || !payload.request_from) return;
        io.to(payload.request_from).emit('messageToKit-kitReply', payload)
    })

});

server.listen(config.port, () => {
    console.log(`KIT-MANAGER: Listening on port ${config.port}`);
});

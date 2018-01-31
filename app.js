const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// mongo connect
mongo.connect('mongodb://127.0.0.1:27017/mongochat',(err,db)=>{
    if(err){
        throw err;
    }
    console.log('mongo connected');
    // connect to socket.io
    client.on('connection',(socket)=>{
        let chat = db.collection("chats");
        // create function to send status
        sendStatus = function(s){
            socket.emit('status',s);
        }
        // get chats from db
        chat.find().limit(100).sort({_id:1}).toArray((err,res)=>{
            if(err) throw err;

            // emit messages
            socket.emit('output',res);
        });
        // handle inout events
        socket.on('input',data=>{
            let name = data.name;
            let message = data.message;
            // check for name and message
            if(name && message){
                // insert message to db
                chat.insert({
                    name:name,
                    message:message
                },()=>{
                    client.emit('output',[data]);
                    //send status
                    sendStatus({
                        message: 'Message Sent!',
                        clear:true
                    });
                });
            }
            else{
                // send error status
                sendStatus('Enter Name and Message both!');
            }
        });

        // handle clear
        socket.on('clear',data=>{
            // remove all chats from collection
            chat.remove({},()=>{
                // emit cleared event
                socket.emit('cleared!');
            });
        });
    });
});
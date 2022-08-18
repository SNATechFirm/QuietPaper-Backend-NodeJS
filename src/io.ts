let io;

export const setIo = server => {
    io = require("socket.io")(server, {
        cors: {
            origin: "*"
        },
    })
    return io;
}

export const getIo = () => {
    if (io)
        return io;
    else
        return "io is not set!"
}
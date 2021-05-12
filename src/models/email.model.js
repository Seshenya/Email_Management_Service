const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const config = require('../../config');
let db;

//open database connection 
openDB = async () => {
    db = await sqlite.open({
        filename: config.dburl,
        driver: sqlite3.Database
    });
}

//create a table in the database 
createTable = async () => {
    await db.run('CREATE TABLE IF NOT EXISTS emails(id integer primary key autoincrement,sendGridID text,x_ID text,reciever text not null,subject text,content text,status text)');
}

// insert one row into the emails table
create = async (newEmail) => {
    try {
        await openDB();
        await createTable();
        const response = await db.run(`INSERT INTO emails(reciever,sendGridID,x_ID,subject,content,status) VALUES(?,?,?,?,?,?)`, [newEmail.to, newEmail.sendGridID,newEmail.xID, newEmail.subject, newEmail.content, newEmail.status]);
        await db.close();
        return [false, response.lastID];
    } catch (e) {
        return [true, e.toString()];
    }
}

//select an email from id
findById = async (id) => {
    try {
        await openDB();
        const response = await db.get(`SELECT * FROM emails WHERE id = ${id};`);
        await db.close();
        return [false, response];
    } catch (e) {
        return [true, e.toString()];
    }

}

//delete an email from id
deleteById = async (id) => {
    try {
        await openDB();
        const response = await db.run(`DELETE FROM emails WHERE id = ${id};`);
        await db.close();
        return [false, response.changes >0?true:false];
    } catch (e) {
        return [true, e.toString()];
    }
}


//change event status
updateStatus = async (id,status) => {
    try {
        let currentStatus;
        if(status=='delivered'){
            currentStatus="SENT";
        }else if (status=='deferred' || status=='bounce'|| status=='dropped'){
            currentStatus="FAILED";
        }
        if (currentStatus) {
            await openDB();
            const response = await db.run(`UPDATE emails SET status = ? WHERE x_ID = ? AND status != ?;`, [currentStatus, id, currentStatus]);
            return [false, response];
        }else{
            return [false, null];
        }
    } catch (e) {
        return [true, e.toString()];
    }
}

module.exports = {
    create,
    findById,
    deleteById,
    updateStatus
};
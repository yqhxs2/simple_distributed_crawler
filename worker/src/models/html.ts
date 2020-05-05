import Mongoose  from "mongoose"
import {MongoConnectionManager} from "../core/db"

// collection
class HtmlModel {

    static modelName = "Html"
    static schema:  Mongoose.SchemaDefinition = {
        url: String,
        text: Buffer
    }


    static insert(conn: MongoConnectionManager, url: string,htmlText: string | Buffer): Promise<Mongoose.Document> {

       if (typeof htmlText === 'string') {
           htmlText = Buffer.from(htmlText)
       }

       const instance = new (conn.Models.get(this.modelName)!)({
           url: url,
           text: htmlText
       })
        
       return instance.save()
        
    }

}

// grid-fs
class HtmlBucket {

}


export {
    HtmlModel,
    HtmlBucket
}
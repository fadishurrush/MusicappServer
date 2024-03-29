const { default: mongoose } = require("mongoose");
const mongodb = require("mongodb");
const multer = require("multer");
const mime = require("mime");
const songModule = require("../modules/song.module");
const MongoClient = require("mongodb").MongoClient;
const { Readable } = require("stream");
const ObjectId = require("mongodb").ObjectID;
const fs = require("fs");
const artworkModule = require("../modules/artwork.module");
const { title } = require("process");
const clint = new MongoClient(
  "mongodb+srv://Devil8Pro:FadixDevil_1402@musicapp.yjfs580.mongodb.net/?retryWrites=true&w=majority"
);
const db = clint.db();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});
module.exports = {
  addSong: (req, res) => {
    upload.fields([
      { name: "song", maxCount: 1 },
      { name: "artwork", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "Upload Request Validation Failed", error: err });
      } else if (!req.body.title) {
        return res
          .status(400)
          .json({ message: "No track name in request body" });
      }else if(req.files.artwork.length ===0){
        return res
        .status(400)
        .json({ message: "No track artwork in request body" });
      }else if (req.files.song.length ===0){
        return res
        .status(400)
        .json({ message: "No track file in request body" });
      }else if(!req.body.artist || !req.body.duration || !req.body.Category){
        return res
        .status(400)
        .json({ message: "didnt fill in all fields required in request body" });
      }
      const body = req.body
      let trackName = req.body.title;
      // Covert buffer to Readable Stream
      songModule.find({title:trackName}).then((dbres)=>{
        if(!dbres){
          return res.status(400).json({
            message:"Song title exists"
          })
        }
      })
      const readableTrackStream = new Readable();
      readableTrackStream.push(req.files?.song[0].buffer);
      readableTrackStream.push(null);

      let bucket = new mongodb.GridFSBucket(db, {
        bucketName: "songs",
      });
      let uploadStream = bucket.openUploadStream(trackName);
      let id = uploadStream.id;
      readableTrackStream.pipe(uploadStream);
      uploadStream.on("error", () => {
        return res.status(500).json({ message: "Error uploading file" });
      });

      uploadStream.on("finish", () => {
      });
      // artwork
      var base64String = req.files?.artwork[0].buffer.toString("base64");
    
          const newArtowork = new artworkModule ({
            _id: new mongoose.Types.ObjectId(),
            title: body?.title,
            base64: base64String
          });
          newArtowork
            .save()
            .catch((e) => {
              res.status(400).json({ message: e });
            });
      
      
        const newSong = new songModule({
          _id: new mongoose.Types.ObjectId(),
          title: body?.title,
          artwork: "https://mozikapp.onrender.com/getSongArtwork?title=" + body?.title ,
          artist: body?.artist,
          duration: body?.duration,
          Category: body?.Category,
          url: "https://mozikapp.onrender.com/getSongURL?title=" + body?.title,
        });
        newSong
          .save()
          .then(() => {
            res.status(200).json({
              message: "song saved",
            });
          })
          .catch((e) => {
            res.status(400).json({ message: e });
          });
    });
  },
  getSong: (req, res) => {
    const title = req.query?.title;
    songModule.find({title : title}).then(DBres =>{
      let category =[]
      
      res.status(DBres ? 200 : 400).json(
        DBres != null
          ? {
              artist: DBres[0]?.artist,
              title: DBres[0]?.title,
              artwork: DBres[0]?.artwork,
              url: DBres[0]?.url,
              duration: DBres[0]?.duration || null,
              Category: DBres[0]?.Category,
              id: DBres[0]._id,
            }
          : { message: "no such song" }
      );
    })
    
  },
  addSongURL:(req, res) => {
    upload.single("song") (req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "Upload Request Validation Failed", error: err });
      } else if (!req.body.title) {
        return res
          .status(400)
          .json({ message: "No track name in request body" });
      }

      let trackName = req.body.title;
      
      // Covert buffer to Readable Stream
      const readableTrackStream = new Readable();
      readableTrackStream.push(req.file?.buffer);
      readableTrackStream.push(null);

      let bucket = new mongodb.GridFSBucket(db, {
        bucketName: "songs",
      });

      if (files.length === 0) {
        res.status(407).json({
          message: "file not found",
        });
      }

    bucket.find({ filename }).toArray().then((bucketres)=>{
      if(bucketres.length >= 1){
        return res.status(400).json({
          message:"Song title exists"
        })
      }
    })
      
        
      
      let uploadStream = bucket.openUploadStream(trackName);
      let id = uploadStream.id;
      readableTrackStream.pipe(uploadStream);
      uploadStream.on("error", () => {
        return res.status(500).json({ message: "Error uploading file" });
      });

      uploadStream.on("finish", () => {
        return res.status(201).json({
          message:
            "File uploaded successfully, stored under Mongo ObjectID: " + id,
        });
      });
    });
  },
  getSongURL: async (req, res) => {
    res.set("content-type", "audio/mp3");
    res.set("accept-ranges", "bytes");
    var filename = req.query?.title;
    let bucket = new mongodb.GridFSBucket(db, {
      bucketName: "songs",
    });
    const files = await bucket.find({ filename }).toArray();
    if (files.length === 0) {
      res.status(407).json({
        message: "file not found",
      });
    } else {
      var id = files[0]?._id;
      var trackId = new ObjectId(id);
      let downloadStream = bucket.openDownloadStream(trackId);

      downloadStream.on("data", (chunk) => {
        res.write(chunk);
      });

      downloadStream.on("error", () => {
        res.sendStatus(404);
      });

      downloadStream.on("end", () => {
        res.end();
      });
    }
  },
  deleteSong: (req, res) => {
    const title = req.query.title;
    songModule
      .remove({ title: title })
      .then(() => {
        res.status(200).json({ message: "deleted" });
      })
      .catch((e) => {
        res.status(400).json({ message: e });
      });
  },
  updateSong: async (req, res) => {
    const title = req.query.title;
    await songModule
      .updateOne({ title: title }, req.body)
      .then(() => {
        res.status(200).json({ message: "updated" });
      })
      .catch((e) => {
        res.status(405).json({ message: e });
      });
  },
  getAllSongs: async (req, res) => {
    songModule.find().then((all) => {
      res
        .status(200)
        .json({ all })
        .catch((e) => {
          res.status(403).json({ message: e });
        });
    });
  },
};

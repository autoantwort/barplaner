const fs = require('fs').promises;
const db = require('../config/db.config.js');
const File = db.File;
const Image = db.Image;
const env = require('../config/env');
const sharp = require('sharp');

fs.mkdir(env.fileStoragePath, { recursive: true });

exports.coreCreateFile = async(buffer, mimeType, filename = null, md5) => {
    const file = await File.create({ filename: filename, mimeType: mimeType, id: md5 });
    await fs.writeFile(env.fileStoragePath + '/' + file.id, buffer);
    return file;
};

exports.coreCreateImage = async(titel, filename, buffer, mimeType, md5) => {
    const file = await exports.coreCreateFile(buffer, mimeType, filename, md5);
    const image = await Image.create({ titel: titel, original: file.id });
    // see https://sharp.readthedocs.io/en/stable/api-output/#parameters_5
    sharp(buffer)
        .resize(300)
        .webp({ quality: 30 })
        .toBuffer().then(async compressedBuffer => {
            const compressedImageFile = await exports.coreCreateFile(compressedBuffer, "image/webp", titel + ".webp");
            image.compressed = compressedImageFile.id;
            image.save();
        }).catch(e => console.trace("Error while creating compressed imaged: ", e));
    return image;
};

exports.coreCreateImageFromRequest = async(req, imageTitel, imageName) => {
    if (!req.files) {
        throw new Error("The request contains no picture");
    } else {
        const file = req.files[imageName];
        if (file === undefined) {
            throw new Error("The request does not contains the image " + imageName);
        }
        return await exports.coreCreateImage(imageTitel, file.name, file.data, file.mimetype, file.md5);
    }
};

exports.getImageById = (req, res) => {
    Image.findByPk(req.params.id).then(image => {
        res.send(image);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};
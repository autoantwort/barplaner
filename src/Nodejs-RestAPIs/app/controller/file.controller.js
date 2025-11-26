import { promises as fs } from 'fs';
import env from '../config/env';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { File } from '../model/file.model.js';
import { Image } from '../model/image.model.js';
import { Sequelize } from '../config/database';

fs.mkdir(env.fileStoragePath, { recursive: true });

export function getFilePathForId(id) { return env.fileStoragePath + '/' + id; }

export async function coreCreateFile(buffer, mimeType, filename = null, md5) {
    if (md5 === undefined) {
        md5 = createHash('md5').update(buffer).digest('hex');
    }
    try {
        const file = await File.create({ filename: filename, mimeType: mimeType, id: md5 });
        await fs.writeFile(getFilePathForId(file.id), buffer);
        return file;
    } catch (e) {
        if (e instanceof Sequelize.UniqueConstraintError) {
            // if the file already exists
            return await File.findByPk(md5);
        } else {
            throw e;
        }
    }
}

/**
 * Returns a File object or throws a error. Function is async
 * @param {object} file A file object from the req.files object
 * @returns {object} The created db.File object
 */
export async function coreCreateFileFromReqFile(file) {
    return await coreCreateFile(file.data, file.mimetype, file.name, file.md5);
}

export async function coreCreateImage(titel, filename, buffer, mimeType, md5) {
    const file = await coreCreateFile(buffer, mimeType, filename, md5);
    const image = await Image.create({ titel: titel, original: file.id });
    // see https://sharp.readthedocs.io/en/stable/api-output/#parameters_5
    sharp(buffer)
        .resize(300)
        .webp({ quality: 30 })
        .toBuffer().then(async compressedBuffer => {
            const compressedImageFile = await coreCreateFile(compressedBuffer, "image/webp", titel + ".webp");
            image.compressed = compressedImageFile.id;
            image.save();
        }).catch(e => console.trace("Error while creating compressed imaged: ", e));
    return image;
}

export async function coreCreateImageFromRequest(req, imageTitel, imageName) {
    if (!req.files) {
        throw new Error("The request contains no picture");
    } else {
        const file = req.files[imageName];
        if (file === undefined) {
            throw new Error("The request does not contains the image " + imageName);
        }
        return await coreCreateImage(imageTitel, file.name, file.data, file.mimetype, file.md5);
    }
}

export function getImageById(req, res) {
    Image.findByPk(req.params.id).then(image => {
        res.send(image);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}
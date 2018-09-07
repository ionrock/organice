import { Dropbox } from 'dropbox';

import { fromJS } from 'immutable';

export default accessToken => {
  const dropboxClient = new Dropbox({ accessToken });

  const getDirectoryListing = path => (
    new Promise((resolve, reject) => {
      dropboxClient.filesListFolder({ path }).then(response => (
        resolve(fromJS(response.entries.map(entry => ({
          id: entry.id,
          name: entry.name,
          isDirectory: entry['.tag'] === 'folder',
          path: entry.path_display,
        }))))
      )).catch(reject);
    })
  );

  const uploadFile = (path, contents) => (
    new Promise((resolve, reject) => (
      dropboxClient.filesUpload({
        path, contents,
        mode: {
          '.tag': 'overwrite',
        },
        autorename: true,
      }).then(resolve).catch(reject)
    ))
  );

  const getFileContentsAndMetadata = path => (
    new Promise((resolve, reject) => (
      dropboxClient.filesDownload({ path }).then(response => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => resolve({
          contents: reader.result,
          lastModifiedAt: response.server_modified,
        }));
        reader.readAsText(response.fileBlob);
      })
    ))
  );

  const getFileContents = path => (
    new Promise((resolve, reject) => (
      getFileContentsAndMetadata(path).then(({ contents }) => resolve(contents)).catch(reject)
    ))
  );

  const deleteFile = path => (
    new Promise((resolve, reject) => (
      dropboxClient.filesDelete({ path }).then(resolve).catch(error => (
        reject(error.error.error['.tag'] === 'path_lookup', error)
      ))
    ))
  );

  return {
    getDirectoryListing,
    uploadFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
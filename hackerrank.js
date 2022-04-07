const { exit } = require("process");

process.stdin.resume();
process.stdin.setEncoding("utf8");

var console_line = "";

const mock_file_system = {
  type: "folder",
  path: "root",
  contains: [
    { type: "folder", path: "folder_test1", contains: [] },
    {
      type: "folder",
      path: "folder_test",
      contains: [
        {
          type: "folder",
          path: "nested_folder_test",
          contains: [
            { type: "file", path: "nested_nested_file_test", contains: [] },
          ],
        },
        { type: "file", path: "nested_file_test", contains: [] },
      ],
    },
    { type: "file", path: "file_test", contains: [] },
  ],
};

class FileSystem {
  constructor() {
    this.currentPath = "/root";
    this.fs = mock_file_system;
  }

  create_directory(path) {
    const dir = path.replace("/", "");
    const search = this.currentPath.split("/").pop();
    const after_fs = FileSystem.searchPath(
      this.fs,
      (ph) => {
        let exists = false;
        ph.contains.map((folder) => {
          if (folder.path === dir) {
            console.log("A folder with that name already exists.");
            exists = true;
          }
        });

        if (!exists) {
          ph.contains.push({ type: "folder", path: dir, contains: [] });
        }
        return ph;
      },
      search
    );
    this.fs = after_fs;
  }

  create_file(path) {
    const dir = path.replace("/", "");
    const search = this.currentPath.split("/").pop();
    const after_fs = FileSystem.searchPath(
      this.fs,
      (ph) => {
        let exists = false;
        ph.contains.map((folder) => {
          if (folder.path === dir) {
            console.log("A file with that name already exists.");
            exists = true;
          }
        });

        if (!exists) {
          ph.contains.push({ type: "file", path: dir, contains: [] });
        }
        return ph;
      },
      search
    );
    this.fs = after_fs;
  }

  change_directory(path) {
    if (path === "..") {
      const currentPathFragments = this.currentPath.split("/");
      //Checks if current path is not root:
      if (currentPathFragments.at(-1) !== "root") {
        this.currentPath = currentPathFragments.slice(0, -1).join("/");
      }
    } else {
      let found = false;
      FileSystem.searchPath(
        this.fs,
        () => {
          found = true;
          this.currentPath += "/" + path;
        },
        path
      );
      if (!found) {
        console.log("The directory was not found.");
      }
    }
    console.log("cd", this.currentPath);
  }

  list_directory(fileSystem, _recursive, deeph = 0) {
    const recursive = _recursive === "-r" || _recursive === "-R";
    let textIdent = "";

    // only for decoration:
    for (let index = 0; index < deeph; index++) {
      textIdent += "-";
    }

    fileSystem.contains?.map((folderContent) => {
      if (textIdent.length) {
        console.log(`${textIdent} ${folderContent.path}`);
      } else {
        console.log(folderContent.path);
      }

      if (recursive) {
        this.list_directory(folderContent, _recursive, deeph + 1);
      }
    });
  }

  // internal utils:
  static searchPath(path, callback, search) {
    if (path.path == search && path.type == "folder") return callback(path);
    
    return path.contains?.map((sub_path) => {
      if (sub_path.type === "folder" && sub_path.path !== search) {
        return FileSystem.searchPath(sub_path, callback, search);
      } else {
        if (sub_path.type == "folder") return callback(sub_path);
      }
      return sub_path;
    });
  }
}

const _fs = new FileSystem();

const processLine = (lin) => {
  lineChunks = lin.split(" ");

  if (lineChunks[1]?.length > 100) {
    console.log("The name cannot be longer than 100 characters.");
    return;
  }

  switch (lineChunks[0]) {
    case "cd":
      _fs.change_directory(lineChunks[1]);
      break;
    case "mkdir":
      _fs.create_directory(lineChunks[1]);
      break;
    case "touch":
      _fs.create_file(lineChunks[1]);
      break;
    case "pwd":
      console.log(_fs.currentPath);
      break;
    case "ls":
      FileSystem.searchPath(
        _fs.fs,
        (directory) => _fs.list_directory(directory, lineChunks[1]),
        _fs.currentPath.split("/").pop()
      );
      break;
    case "quit":
      exit(0);
    default:
      console.log("Command line not recognized.");
      break;
  }
};

process.stdin.on("data", function (chunk) {
  lines = chunk.split("\n");

  lines[0] = console_line + lines[0];
  console_line = lines.pop();

  lines.forEach(processLine);
});

process.stdin.on("end", function () {
  processLine(console_line);
});
import {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
  MenuItemConstructorOptions,
} from "electron";
import path from "path";
import fs from "fs";

interface IFile {
  name: string;
  content: string;
  saved: boolean;
  path: string;
}

class Application {
  win: BrowserWindow | undefined | null;
  file: IFile;

  constructor() {
    this.file = {
      name: "",
      content: "",
      saved: false,
      path: "",
    };
    this.start();
  }

  async createWindow() {
    const windowConfig = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      icon: path.join(__dirname, "..", "assets", "icons", "main-icon.png"),
    };
    this.win = new BrowserWindow(windowConfig);
    await this.win.loadURL(
      path.join("file://", __dirname, "..", "pages", "index.html")
    );

    this.createNewFile();
  }

  async start() {
    await app.whenReady();
    this.createWindow();
    this.listenEvents();
    this.setMenus();
  }

  listenEvents() {
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    ipcMain.on("update-content", (event, data) => {
      this.file.content = data;
    });
  }

  createNewFile() {
    this.file = {
      name: "new-file.txt",
      content: "",
      saved: false,
      path: app.getPath("documents") + "/new-file.txt",
    };
    this.win?.webContents.send("set-file", this.file);
  }

  async saveFileAs() {
    try {
      const dialogFile = await dialog.showSaveDialog({
        defaultPath: this.file.path,
      });

      if (!dialogFile.canceled && dialogFile.filePath)
        await this.writeFile(dialogFile.filePath);
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async saveFile() {
    const { saved, path } = this.file;
    if (saved) {
      await this.writeFile(path);
    } else {
      await this.saveFileAs();
    }
  }

  async writeFile(filePath: string) {
    try {
      fs.writeFile(filePath, this.file.content, (err) => {
        if (err) {
          console.log(err);
          return;
        }
        this.file.path = filePath;
        this.file.saved = true;
        this.file.name = path.basename(filePath);
        this.win?.webContents.send("set-file", this.file);
      });
    } catch (error) {
      console.log(error);
      return;
    }
  }

  readFile(path: string) {
    try {
      return fs.readFileSync(path, { encoding: "utf-8" });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async openFile() {
    const dialogOptions = {
      defaultPath: this.file.path,
      filters: [
        {
          name: "Text Files",
          extensions: ["txt", "html", "js", "css", "xml", "json"],
        },
      ],
    };
    const dialogFile = await dialog.showOpenDialog(dialogOptions);

    if (dialogFile.canceled) return;
    const filePath = dialogFile.filePaths[0];

    this.file = {
      name: path.basename(filePath),
      content: this.readFile(filePath),
      saved: true,
      path: filePath,
    };
    this.win?.webContents.send("set-file", this.file);
  }

  setMenus() {
    const createNewFile = this.createNewFile.bind(this);
    const saveFileAs = this.saveFileAs.bind(this);
    const saveFile = this.saveFile.bind(this);
    const openFile = this.openFile.bind(this);

    const template = [
      {
        label: "File",
        submenu: [
          {
            label: "New File",
            click() {
              createNewFile();
            },
            accelerator: "CmdOrCtrl+N",
          },
          {
            label: "Open File",
            click() {
              openFile();
            },
            accelerator: "CmdOrCtrl+O",
          },
          {
            label: "Save",
            click() {
              saveFile();
            },
            accelerator: "CmdOrCtrl+S",
          },
          {
            label: "Save as",
            click() {
              saveFileAs();
            },
            accelerator: "CmdOrCtrl+Shift+S",
          },
          {
            label: "Close",
            role: process.platform === "darwin" ? "close" : "quit",
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "copy" },
          { role: "cut" },
          { role: "paste" },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Leonardo 🛠",
            click() {
              shell.openExternal("https://github.com/Leonardo-and");
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(
      template as MenuItemConstructorOptions[]
    );
    Menu.setApplicationMenu(menu);
  }
}

new Application();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Application {
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
            icon: path_1.default.join(__dirname, "..", "assets", "icons", "main-icon.png"),
        };
        this.win = new electron_1.BrowserWindow(windowConfig);
        await this.win.loadURL(path_1.default.join("file://", __dirname, "..", "pages", "index.html"));
        this.createNewFile();
    }
    async start() {
        await electron_1.app.whenReady();
        this.createWindow();
        this.listenEvents();
        this.setMenus();
    }
    listenEvents() {
        electron_1.app.on("activate", () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0)
                this.createWindow();
        });
        electron_1.app.on("window-all-closed", () => {
            if (process.platform !== "darwin") {
                electron_1.app.quit();
            }
        });
        electron_1.ipcMain.on("update-content", (event, data) => {
            this.file.content = data;
        });
    }
    createNewFile() {
        var _a;
        this.file = {
            name: "new-file.txt",
            content: "",
            saved: false,
            path: electron_1.app.getPath("documents") + "/new-file.txt",
        };
        (_a = this.win) === null || _a === void 0 ? void 0 : _a.webContents.send("set-file", this.file);
    }
    async saveFileAs() {
        try {
            const dialogFile = await electron_1.dialog.showSaveDialog({
                defaultPath: this.file.path,
            });
            if (!dialogFile.canceled && dialogFile.filePath)
                await this.writeFile(dialogFile.filePath);
        }
        catch (error) {
            console.log(error);
            return;
        }
    }
    async saveFile() {
        const { saved, path } = this.file;
        if (saved) {
            await this.writeFile(path);
        }
        else {
            await this.saveFileAs();
        }
    }
    async writeFile(filePath) {
        try {
            fs_1.default.writeFile(filePath, this.file.content, (err) => {
                var _a;
                if (err) {
                    console.log(err);
                    return;
                }
                this.file.path = filePath;
                this.file.saved = true;
                this.file.name = path_1.default.basename(filePath);
                (_a = this.win) === null || _a === void 0 ? void 0 : _a.webContents.send("set-file", this.file);
            });
        }
        catch (error) {
            console.log(error);
            return;
        }
    }
    readFile(path) {
        try {
            return fs_1.default.readFileSync(path, { encoding: "utf-8" });
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async openFile() {
        var _a;
        const dialogOptions = {
            defaultPath: this.file.path,
            filters: [
                {
                    name: "Text Files",
                    extensions: ["txt", "html", "js", "css", "xml", "json"],
                },
            ],
        };
        const dialogFile = await electron_1.dialog.showOpenDialog(dialogOptions);
        if (dialogFile.canceled)
            return;
        const filePath = dialogFile.filePaths[0];
        this.file = {
            name: path_1.default.basename(filePath),
            content: this.readFile(filePath),
            saved: true,
            path: filePath,
        };
        (_a = this.win) === null || _a === void 0 ? void 0 : _a.webContents.send("set-file", this.file);
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
                            electron_1.shell.openExternal("https://github.com/Leonardo-and");
                        },
                    },
                ],
            },
        ];
        const menu = electron_1.Menu.buildFromTemplate(template);
        electron_1.Menu.setApplicationMenu(menu);
    }
}
new Application();
//# sourceMappingURL=main.js.map
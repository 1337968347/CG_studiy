interface PendIngStatus {
  total: number;
  pending: number;
  failed: number;
}

export default class Loader {
  rootPath: string;
  resources: { [key: string]: any } = {};
  // 资源加载完成回调
  onRendy: () => void;
  pendingStatus: PendIngStatus = {
    total: 0,
    pending: 0,
    failed: 0,
  };

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  load(resources: string[]) {
    for (let i = 0; i < resources.length; i++) {
      const path = resources[i];
      if (path in resources) {
        continue;
      }
      this.pendingStatus.pending++;
      this.pendingStatus.total++;

      if (/\.(jpe?g|gif|png)$/.test(path)) {
        this.loadImage(path);
        continue;
      }

      if (/\.json$/.test(path)) {
        this.loadJSON(path);
        continue;
      }

      this.loadData(path);
    }
    setTimeout(() => {
      this.pendingStatus.pending === 0 && this.onRendy && this.onRendy();
    }, 1);
  }

  setOnRendy(onRendy: () => void) {
    this.onRendy = onRendy;
  }

  loadImage = (src: string) => {
    const imageEl = document.createElement('img');
    imageEl.src = this.rootPath + src;
    imageEl.onload = () => {
      this.success(src, imageEl);
    };
    imageEl.onerror = () => {
      this.error(src, imageEl);
    };
  };

  loadJSON = (src: string) => {
    fetch(this.rootPath + src)
      .then(async (res) => {
        return res.json();
      })
      .then((json) => this.success(src, json))
      .catch((e) => {
        this.error(src, e);
      });
  };

  loadData = (src: string) => {
    fetch(this.rootPath + src)
      .then(async (res) => {
        return res.text();
      })
      .then((text) => {
        this.success(src, text);
      })
      .catch((e) => {
        this.error(src, e);
      });
  };

  success = (src: string, data: any) => {
    this.resources[src] = data;
    this.pendingStatus.pending--;
    this.pendingStatus.pending === 0 && this.onRendy && this.onRendy();
  };

  error = (src: string, err: any) => {
    this.pendingStatus.pending--;
    this.pendingStatus.failed++;
    this.resources[src] = null;
    if (typeof err !== 'string') {
      err.path = src;
    }
    throw err;
  };
}

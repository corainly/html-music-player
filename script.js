class MusicPlayer {
    constructor(container) {
        this.container = container;
        this.audio = null;
        this.progress = null;
        this.thumb = null;
        this.playBtn = null;
        this.lyricsEl = null;
        this.lyrics = [];
        this.isDragging = false;
        
        this.init();
    }
    
    init() {

        const config = {
            title: this.container.getAttribute('data-title'),
            artist: this.container.getAttribute('data-artist'),
            cover: this.container.getAttribute('data-cover'),
            audio: this.container.getAttribute('data-audio'),
            lrc: this.container.getAttribute('data-lrc')
        };

        this.container.innerHTML = `
            <div class="background" style="background-image:url('${config.cover}')"></div>
            <img class="cover" src="${config.cover}" draggable="false">
            <div class="content">
                <div class="info">
                    <h3 class="title">${config.title}</h3>
                    <p class="artist">${config.artist}</p>
                </div>
                <div class="lyrics">点击播放</div>
                <div class="controls">
                    <div class="progress-bar">
                        <div class="progress"></div>
                        <div class="thumb"></div>
                    </div>
                    <button class="play-btn"></button>
                </div>
            </div>
            <audio src="${config.audio}" preload="metadata"></audio>
        `;

        this.audio = this.container.querySelector('audio');
        this.progress = this.container.querySelector('.progress');
        this.thumb = this.container.querySelector('.thumb');
        this.playBtn = this.container.querySelector('.play-btn');
        this.lyricsEl = this.container.querySelector('.lyrics');
        this.progressBar = this.container.querySelector('.progress-bar');
        this.lyrics = this.parseLRC(config.lrc);
        this.setupEvents();
    }
    
    parseLRC(lrcText) {
        return lrcText.trim().split('\n')
            .map(line => {
                const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
                if (match) {
                    const min = parseInt(match[1]);
                    const sec = parseInt(match[2]);
                    const ms = parseInt(match[3].padEnd(3, '0')) / 1000;
                    return {
                        time: min * 60 + sec + ms,
                        text: match[4].trim()
                    };
                }
                return null;
            })
            .filter(line => line !== null && line.text !== '');
    }
    
    setupEvents() {
        this.playBtn.addEventListener('click', () => this.togglePlay());

        this.progressBar.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.seek(e);
            document.addEventListener('mousemove', this.handleDrag);
            document.addEventListener('mouseup', this.handleDragEnd);
        });
        
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.resetPlayer());
        this.audio.addEventListener('play', () => {
            this.playBtn.classList.add('playing');
        });
        this.audio.addEventListener('pause', () => {
            this.playBtn.classList.remove('playing');
        });
        
        this.handleDrag = (e) => this.seek(e);
        this.handleDragEnd = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', this.handleDrag);
            document.removeEventListener('mouseup', this.handleDragEnd);
        };
    }
    
    togglePlay() {
        if (this.audio.paused) {
            this.audio.play().catch(e => {
                this.lyricsEl.textContent = "点击播放";
            });
        } else {
            this.audio.pause();
        }
    }
    
    seek(e) {
        if (!this.isDragging && e.target !== this.progressBar) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
        
        this.progress.style.width = `${percent * 100}%`;
        this.thumb.style.left = `${percent * 100}%`;
        this.audio.currentTime = percent * this.audio.duration;
        
        if (!this.isDragging) {
            this.updateLyrics(this.audio.currentTime);
        }
    }
    
    updateProgress() {
        if (this.isDragging || this.audio.duration === 0) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = `${percent}%`;
        this.thumb.style.left = `${percent}%`;
        
        this.updateLyrics(this.audio.currentTime);
    }
    
    updateLyrics(currentTime) {
        let currentLyric = '';
        
        for (let i = 0; i < this.lyrics.length; i++) {
            if (currentTime < this.lyrics[i].time) {
                currentLyric = this.lyrics[i - 1]?.text || '';
                break;
            }
            
            if (i === this.lyrics.length - 1) {
                currentLyric = this.lyrics[i].text;
            }
        }
        
        if (currentLyric !== this.lyricsEl.textContent) {
            this.lyricsEl.style.opacity = 0;
            setTimeout(() => {
                this.lyricsEl.textContent = currentLyric || '~ 纯音乐 ~';
                this.lyricsEl.style.opacity = 1;
            }, 200);
        }
    }
    
    resetPlayer() {
        this.progress.style.width = '0%';
        this.thumb.style.left = '0%';
        this.playBtn.classList.remove('playing');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.music-player').forEach(player => {
        new MusicPlayer(player);
    });
});



interface PcmFormat {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

export class AudioLivePlayer {
  private audioContext: AudioContext;
  private pcmFormat: PcmFormat | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  public setFormat(mimeType: string): void {
    const format = this.parsePcmMimeType(mimeType);
    if (format) {
      if (this.pcmFormat && (this.pcmFormat.sampleRate !== format.sampleRate || this.pcmFormat.channels !== format.channels || this.pcmFormat.bitsPerSample !== format.bitsPerSample)) {
          this.stopAndClear();
      }
      this.pcmFormat = format;
    } else {
      console.error("AudioLivePlayer: Unsupported or invalid MIME type received:", mimeType);
      this.pcmFormat = null;
    }
  }

  private parsePcmMimeType(mimeType: string): PcmFormat | null {
    if (!mimeType) return null;

    const lowerMimeType = mimeType.toLowerCase();
    const defaults: PcmFormat = {
        sampleRate: 0, // Must be provided
        bitsPerSample: 16, 
        channels: 1,      
    };
    
    let parsedFormat: Partial<PcmFormat> = {};

    if (lowerMimeType.startsWith('audio/l')) {
        const bitPart = lowerMimeType.substring('audio/l'.length).split(';')[0];
        const bits = parseInt(bitPart, 10);
        if (!isNaN(bits)) {
            parsedFormat.bitsPerSample = bits;
        }
    } else if (lowerMimeType.startsWith('audio/pcm')) {
        // For audio/pcm, we rely on parameters or defaults
        // bitsPerSample and channels will use defaults if not overridden by params
    } else {
        // console.warn(`AudioLivePlayer: Unsupported base MIME type: ${mimeType}`);
        return null; 
    }

    const params = mimeType.split(';').slice(1);
    params.forEach(param => {
      const [key, value] = param.split('=').map(s => s.trim().toLowerCase());
      if (key === 'rate' && value) {
        parsedFormat.sampleRate = parseInt(value, 10);
      } else if (key === 'channels' && value) {
        parsedFormat.channels = parseInt(value, 10);
      }
      // Could add explicit bitsPerSample parsing from params if needed, e.g. ';bits=16'
    });

    const finalFormat: PcmFormat = {
        sampleRate: parsedFormat.sampleRate || defaults.sampleRate,
        channels: parsedFormat.channels || defaults.channels,
        bitsPerSample: parsedFormat.bitsPerSample || defaults.bitsPerSample,
    };

    if (finalFormat.sampleRate > 0 && finalFormat.channels > 0 && finalFormat.bitsPerSample > 0) {
    //   console.log("AudioLivePlayer parsed format:", finalFormat, "from MIME:", mimeType);
      return finalFormat;
    }
    
    // console.error("AudioLivePlayer: Failed to parse required parameters from MIME type:", mimeType, "Resulted in:", finalFormat);
    return null;
  }

  public addChunk(base64Chunk: string): void {
    if (!this.pcmFormat) {
      // console.warn("AudioLivePlayer: Audio format not set or invalid. Cannot add chunk.");
      return;
    }
    try {
      const binaryString = atob(base64Chunk);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.audioQueue.push(bytes.buffer);
      this.play();
    } catch (e) {
      console.error("AudioLivePlayer: Error decoding base64 audio chunk:", e);
    }
  }

  private async play(): Promise<void> {
    if (this.isPlaying || this.audioQueue.length === 0 || !this.pcmFormat || !this.audioContext) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.error("AudioLivePlayer: Error resuming AudioContext:", e);
        this.isPlaying = false;
        return;
      }
    }

    this.isPlaying = true;
    const pcmData = this.audioQueue.shift()!;
    
    const { sampleRate, channels, bitsPerSample } = this.pcmFormat;
    const bytesPerSample = bitsPerSample / 8;
    
    // Ensure pcmData.byteLength is a multiple of (channels * bytesPerSample)
    // This can happen if the chunk is incomplete or malformed.
    if (pcmData.byteLength % (channels * bytesPerSample) !== 0) {
        // console.warn(`AudioLivePlayer: PCM data byteLength (${pcmData.byteLength}) is not a multiple of frame size (${channels * bytesPerSample}). Skipping chunk.`);
        this.isPlaying = false;
        this.play(); // Try next chunk
        return;
    }
    const frameCount = pcmData.byteLength / (channels * bytesPerSample);


    if (frameCount <= 0) {
        // console.warn("AudioLivePlayer: Frame count is zero or negative. Skipping chunk.");
        this.isPlaying = false;
        this.play(); 
        return;
    }

    try {
        const audioBuffer = this.audioContext.createBuffer(channels, frameCount, sampleRate);

        for (let i = 0; i < channels; i++) {
            const channelData = audioBuffer.getChannelData(i);
            if (bitsPerSample === 16) {
                // Ensure enough data for Int16Array view, considering offset
                if (pcmData.byteLength < i * bytesPerSample + frameCount * channels * bytesPerSample) {
                    console.error("AudioLivePlayer: Not enough data for 16-bit PCM view.");
                    this.isPlaying = false; this.play(); return;
                }
                const pcmView = new Int16Array(pcmData, 0); // Read from start of buffer, handle interleaving
                for (let j = 0; j < frameCount; j++) {
                    channelData[j] = pcmView[j * channels + i] / 32768.0; 
                }
            } else if (bitsPerSample === 8) { 
                 if (pcmData.byteLength < i * bytesPerSample + frameCount * channels * bytesPerSample) {
                    console.error("AudioLivePlayer: Not enough data for 8-bit PCM view.");
                    this.isPlaying = false; this.play(); return;
                }
                 const pcmView = new Uint8Array(pcmData, 0);
                 for (let j = 0; j < frameCount; j++) {
                    channelData[j] = (pcmView[j * channels + i] - 128) / 128.0; 
                }
            } else {
                console.error(`AudioLivePlayer: Unsupported bitsPerSample: ${bitsPerSample}`);
                this.isPlaying = false;
                this.play();
                return;
            }
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.onended = () => {
            this.isPlaying = false;
            if (this.currentSource === source) { 
                 this.currentSource = null;
            }
            this.play(); 
        };
        source.start();
        this.currentSource = source;

    } catch (error) {
        console.error("AudioLivePlayer: Error processing or playing audio chunk:", error);
        this.isPlaying = false;
        this.play(); 
    }
  }

  public stopAndClear(): void {
    if (this.currentSource) {
      this.currentSource.onended = null; 
      try {
        this.currentSource.stop();
      } catch (e) {
        // console.warn("AudioLivePlayer: Error stopping current source (may have already stopped):", e);
      }
      this.currentSource = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
    // console.log("AudioLivePlayer: Stopped and cleared queue.");
  }

  public isActive(): boolean {
    return this.isPlaying || this.audioQueue.length > 0;
  }
}
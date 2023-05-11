import axios from "axios";

export class PlexAPI {
  constructor(
    private readonly _plexURL: string,
    private readonly _plexToken: string
  ) { }

  public async getStreamInfo(): Promise<{ activeStreams: number | undefined, activeTranscodes: number | undefined }> {
    try {
      const endpoint = `${this._plexURL}/status/sessions?X-Plex-Token=${this._plexToken}`;
      const mediaContainer = (await axios.get(endpoint)).data.MediaContainer;
      const activeStreams: number = mediaContainer.size;
      const activeTranscodes: number = activeStreams === 0 ? 0 : mediaContainer.Metadata.filter((m: { transcodeSession: boolean | string }) => m.transcodeSession !== undefined).length;
      return { activeStreams, activeTranscodes };
    } catch (e) {
      console.error(e);
      return { activeStreams: undefined, activeTranscodes: undefined }
    }
  }
}
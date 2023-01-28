export default function useAudio(src: string) {
    const audio = new Audio(src);

    return () => audio.play();
}

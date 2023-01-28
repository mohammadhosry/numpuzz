<script lang="ts">
import { OnLongPress } from "@vueuse/components";
import { ref, computed, onMounted, watch } from "vue";
import Confetti from "../node_modules/vue-confetti/src/confetti";
import { useInterval, useLocalStorage } from "@vueuse/core";
import { rand } from "@vueuse/shared";
import useAudio from "./composables/useAudio";
import longPress from "./assets/long-press.wav";
import win from "./assets/win.wav";

type Cell = {
    num: number;
    selected: boolean;
    ans: boolean;
    off: boolean;
};

type Row = Cell[];

export default {
    components: { OnLongPress },
    setup() {
        const longPressPlay = useAudio(longPress);
        const winPlay = useAudio(win);

        const table = ref<Row[]>([]);
        const x = useLocalStorage("x", 4);
        const y = useLocalStorage("y", 4);
        const rowsAns = ref<number[]>([]);
        const colsAns = ref<number[]>([]);
        const xyOptions = ref([3, 4, 5, 6]);
        const subSeconds = ref(0);
        const bestTimes = useLocalStorage<any>("bestTimes", {});
        const sfx = useLocalStorage("sfx", false);

        const confetti = new Confetti();
        const {
            counter: seconds,
            pause,
            resume,
        } = useInterval(1000, { controls: true, immediate: false });

        const reset = (first = false) => {
            resume();

            subSeconds.value = seconds.value;
            table.value = Array(y.value);

            for (let i = 0; i < y.value; i++) {
                table.value[i] = Array(x.value);

                for (let j = 0; j < x.value; j++) {
                    table.value[i][j] = {
                        num: rand(1, 9),
                        selected: false,
                        off: false,
                        ans: rand(1, x.value) > x.value / 2,
                    };
                }

                if (table.value[i].every((a: Cell) => !a.ans)) {
                    table.value[i][rand(0, x.value - 1)].ans = true;
                }
            }

            for (let i = 0; i < x.value; i++) {
                let flag = false;

                for (let j = 0; j < y.value; j++) {
                    flag ||= table.value[j][i].ans;
                }

                if (!flag) {
                    table.value[rand(0, y.value - 1)][i].ans = true;
                }
            }

            rowsAns.value = calcRowsSum("ans");
            colsAns.value = calcColsSum("ans");
        };

        const calcRowsSum = (key = "selected"): number[] => {
            return table.value.map((row: Row) =>
                row.reduce((a, b) => (a += b?.[key] && b?.num), 0)
            );
        };

        const calcColsSum = (key = "selected"): number[] => {
            return table.value.reduce((r: number[], a: Row) => {
                a.forEach((b, i) => {
                    r[i] ||= 0;
                    r[i] += +b?.[key] && b.num;
                });

                return r;
            }, []);
        };

        const clear = () => {
            table.value.forEach((row: Row) =>
                row.forEach((cell) => (cell.selected = cell.off = false))
            );
        };

        const toggleSelected = (cell: Cell) => {
            if (!cell.off) cell.selected = !cell.selected;
        };

        const setOrToggleOff = (cell: Cell, value?: boolean) => {
            if (!cell.selected) cell.off = value ?? !cell.off;
            sfx.value && longPressPlay();
        };

        const rowUnselectedOff = (i: number) => {
            table.value[i].forEach((cell) => setOrToggleOff(cell, true));
        };

        const colUnselectedOff = (j: number) => {
            for (let i = 0; i < y.value; i++) {
                setOrToggleOff(table.value[i][j], true);
            }
        };

        const rowsSum = computed(() => calcRowsSum());

        const colsSum = computed(() => calcColsSum());

        const timer = computed(() => {
            const s = `0${(seconds.value - subSeconds.value) % 60}`;
            const m = `0${Math.floor((seconds.value - subSeconds.value) / 60)}`;

            return `${m.slice(-2)}:${s.slice(-2)}`;
        });

        const xyKey = computed(() => `${table.value[0]?.length}x${table.value.length}`);

        const xyBestTime = computed<undefined | string>(() => bestTimes.value[xyKey.value]);

        const won = computed(
            () =>
                rowsSum.value.join("") == rowsAns.value.join("") &&
                colsSum.value.join("") == colsAns.value.join("")
        );

        const handleWinnig = () => {
            pause();

            if (!bestTimes.value[xyKey.value] || timer.value < bestTimes.value[xyKey.value]) {
                bestTimes.value[xyKey.value] = timer.value;
            }

            confetti.start();

            sfx.value && winPlay();
        };

        const handleLosing = () => {
            confetti.stop();
        };

        watch(won, (val) => {
            val ? handleWinnig() : handleLosing();
        });

        onMounted(() => {
            reset(true);
        });

        return {
            x,
            y,
            xyOptions,
            table,
            rowsAns,
            rowsSum,
            colsAns,
            colsSum,
            timer,
            xyBestTime,
            sfx,
            reset,
            toggleSelected,
            setOrToggleOff,
            clear,
            rowUnselectedOff,
            colUnselectedOff,
        };
    },
};
</script>

<style>
* {
    text-align: center !important;
}

td {
    cursor: pointer;
}

.selected {
    background-color: #9bc362;
    color: #000000;
}

.done {
    background-color: gold;
    color: #000000;
    font-weight: bold;
}

.off {
    color: var(--muted-color);
}

ul {
    width: 100%;
    justify-content: space-between;
}

details * {
    text-align: initial !important;
}
</style>

<template>
    <nav>
        <ul>
            <li>
                <select v-model="x">
                    <option v-for="opt in xyOptions" :value="opt">{{ opt }}</option>
                </select>
            </li>
            <li>X</li>
            <li>
                <select v-model="y">
                    <option v-for="opt in xyOptions" :value="opt">{{ opt }}</option>
                </select>
            </li>
            <li>
                <button @click="() => reset()">Shuffle</button>
            </li>
        </ul>
    </nav>
    <br />
    <h6 v-if="xyBestTime">{{ table[0].length }} X {{ table.length }} record: {{ xyBestTime }}</h6>
    <h4>{{ timer }}</h4>
    <table>
        <tr v-for="(row, i) in table">
            <OnLongPress
                as="td"
                v-for="cell in row"
                :class="{ selected: cell.selected, off: cell.off }"
                @click="toggleSelected(cell)"
                @trigger="setOrToggleOff(cell)"
            >
                {{ cell.num }}
            </OnLongPress>
            <td :class="{ done: rowsAns[i] == rowsSum[i] }" @click="rowUnselectedOff(i)">
                {{ rowsAns[i] }} ({{ rowsSum[i] }})
            </td>
        </tr>
        <tr>
            <td
                v-for="(sum, j) in colsAns"
                :class="{ done: sum == colsSum[j] }"
                @click="colUnselectedOff(j)"
            >
                {{ sum }} ({{ colsSum[j] }})
            </td>
        </tr>
    </table>
    <br />
    <br />
    <button @click="clear">Clear</button>
    <br />
    <details>
        <summary>Settings</summary>
        <fieldset>
            <label>
                <input v-model="sfx" type="checkbox" name="switch" role="switch" />
                SFX
            </label>
        </fieldset>
    </details>
</template>

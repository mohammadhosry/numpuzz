<script lang="ts">
import { OnLongPress } from "@vueuse/components";
import { ref, computed, onMounted, watch } from 'vue';

type Cell = {
    num: number;
    selected: boolean;
    ans: boolean;
    off: boolean;
};

type Row = Cell[];

type State = {
    x: number;
    y: number;
    table: Row[];
    rowsAns: number[];
    colsAns: number[];
    xyOptions: number[];
};

const randomInt = (max = 9, min = 1): number => Math.floor(Math.random() * max) + min;

export default {
    components: { OnLongPress },
    setup() {
        const table = ref<Row[]>([]);
        const x = ref(4);
        const y = ref(4);
        const rowsAns = ref<number[]>([]);
        const colsAns = ref<number[]>([]);
        const xyOptions = ref<number[]>([3, 4, 5, 6]);

        const reset = () => {
            table.value = Array(y.value);

            for (let i = 0; i < y.value; i++) {
                table.value[i] = Array(x.value);

                for (let j = 0; j < x.value; j++) {
                    table.value[i][j] = {
                        num: randomInt(),
                        selected: false,
                        off: false,
                        ans: randomInt(x.value) > x.value / 2,
                    };
                }

                if (table.value[i].every((a: Cell) => !a.ans)) {
                    table.value[i][randomInt(x.value - 1, 0)].ans = true;
                }
            }

            for (let i = 0; i < x.value; i++) {
                let flag = false;

                for (let j = 0; j < y.value; j++) {
                    flag ||= table.value[j][i].ans;
                }

                if (!flag) {
                    table.value[randomInt(y.value - 1, 0)][i].ans = true;
                }
            }

            rowsAns.value = calcRowsSum("ans");
            colsAns.value = calcColsSum("ans");
        }

        const calcRowsSum = (key = "selected"): number[] => {
            return table.value.map((row: Row) => row.reduce((a, b) => (a += b?.[key] && b?.num), 0));
        }

        const calcColsSum = (key = "selected"): number[] => {
            return table.value.reduce((r: number[], a: Row) => {
                a.forEach((b, i) => {
                    r[i] ||= 0;
                    r[i] += +b?.[key] && b.num;
                });

                return r;
            }, []);
        }

        const clear = () => {
            table.value.forEach((row: Row) =>
                row.forEach((cell) => (cell.selected = cell.off = false))
            );
        }

        const toggleSelected = (cell: Cell) => {
            !cell.off && (cell.selected = !cell.selected);
        }

        const toggleOff = (cell: Cell) => {
            !cell.selected && (cell.off = !cell.off);
        }

        const rowUnselectedOff = (i: number) => {
            table.value[i].forEach((cell: Cell) => !cell.selected && (cell.off = true));
        }

        const colUnselectedOff = (j: number) => {
            for (let i = 0; i < y.value; i++) {
                !table.value[i][j].selected && (table.value[i][j].off = true);
            }
        }

        const rowsSum = computed(() => calcRowsSum());

        const colsSum = computed(() => calcColsSum());


        const won = computed(() => {
            return (
                rowsSum.value.join("") == rowsAns.value.join("") &&
                colsSum.value.join("") == colsAns.value.join("")
            );
        });

        watch(won, (val) => {
            if (val) {
                // this.$confetti.start();
            } else {
                // this.$confetti.stop();
            }
        });

        onMounted(() => {
            reset();
        });

        return {
            x, y, xyOptions, table,
            reset,
            toggleSelected,
            toggleOff,
            rowsAns,
            rowsSum,
            colsAns,
            colsSum,
            clear,
            rowUnselectedOff,
            colUnselectedOff,
        }
    },
};
</script>

<style>
* {
    text-align: center !important;
}

.x {
    align-self: center;
    margin-bottom: var(--spacing);
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
</style>

<template>
    <div class="grid">
        <select v-model="x">
            <option v-for="opt in xyOptions" :value="opt">{{ opt }}</option>
        </select>
        <span class="x">X</span>
        <select v-model="y">
            <option v-for="opt in xyOptions" :value="opt">{{ opt }}</option>
        </select>
        <button @click="reset">Shuffle</button>
    </div>
    <br />
    <br />
    <br />
    <table>
        <tr v-for="(row, i) in table">
            <OnLongPress
                as="td"
                v-for="(cell, j) in row"
                :class="{ selected: cell.selected, off: cell.off }"
                @click="toggleSelected(cell)"
                @trigger="toggleOff(cell)"
            >
                {{ cell.num }}
            </OnLongPress>
            <td :class="{ done: rowsAns[i] == rowsSum[i] }" @click="rowUnselectedOff(i)">
                {{ rowsAns[i] }} ({{ rowsSum[i] }})
            </td>
        </tr>
        <tr>
            <td
                v-for="(num, j) in colsAns"
                :class="{ done: num == colsSum[j] }"
                @click="colUnselectedOff(j)"
            >
                {{ num }} ({{ colsSum[j] }})
            </td>
        </tr>
    </table>
    <br />
    <br />
    <button @click="clear">Clear</button>
</template>

<script lang="ts">
import { OnLongPress } from "@vueuse/components";

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
    data(): State {
        return {
            x: 4,
            y: 4,
            table: [],
            rowsAns: [],
            colsAns: [],
            xyOptions: [3, 4, 5, 6],
        };
    },
    methods: {
        reset() {
            this.table = Array(this.y);

            for (let i = 0; i < this.y; i++) {
                this.table[i] = Array(this.x);

                for (let j = 0; j < this.x; j++) {
                    this.table[i][j] = {
                        num: randomInt(),
                        selected: false,
                        off: false,
                        ans: randomInt(this.x) > this.x / 2,
                    };
                }

                if (this.table[i].every((a: Cell) => !a.ans)) {
                    this.table[i][randomInt(this.x - 1, 0)].ans = true;
                }
            }

            for (let i = 0; i < this.x; i++) {
                let flag = false;

                for (let j = 0; j < this.y; j++) {
                    flag ||= this.table[j][i].ans;
                }

                if (!flag) {
                    this.table[randomInt(this.y - 1, 0)][i].ans = true;
                }
            }

            this.rowsAns = this.calcRowsSum("ans");
            this.colsAns = this.calcColsSum("ans");
        },
        calcRowsSum(key = "selected"): number[] {
            return this.table.map((row: Row) => row.reduce((a, b) => (a += b?.[key] && b?.num), 0));
        },
        calcColsSum(key = "selected"): number[] {
            return this.table.reduce((r: number[], a: Row) => {
                a.forEach((b, i) => {
                    r[i] ||= 0;
                    r[i] += +b?.[key] && b.num;
                });

                return r;
            }, []);
        },
        clear() {
            this.table.forEach((row: Row) =>
                row.forEach((cell) => (cell.selected = cell.off = false))
            );
        },
        toggleSelected(cell: Cell) {
            !cell.off && (cell.selected = !cell.selected);
        },
        toggleOff(cell: Cell) {
            !cell.selected && (cell.off = !cell.off);
        },
        rowUnselectedOff(i: number) {
            this.table[i].forEach((cell: Cell) => !cell.selected && (cell.off = true));
        },
        colUnselectedOff(j: number) {
            for (let i = 0; i < this.y; i++) {
                !this.table[i][j].selected && (this.table[i][j].off = true);
            }
        },
    },
    computed: {
        won() {
            return (
                this.rowsSum.join("") == this.rowsAns.join("") &&
                this.colsSum.join("") == this.colsAns.join("")
            );
        },
        rowsSum(): number[] {
            return this.calcRowsSum();
        },
        colsSum(): number[] {
            return this.calcColsSum();
        },
    },
    created() {
        this.reset();
    },
    watch: {
        won(val) {
            if (val) {
                this.$confetti.start();
            } else {
                this.$confetti.stop();
            }
        },
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

<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Bulk Payslips</title>
    <style>
        @page {
            margin: 10mm;
            padding: 0;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 8px;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .page {
            width: 100%;
            overflow: hidden;
        }

        .slip-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            page-break-inside: avoid;
        }

        .slip {
            border: 1px dashed #ccc;
            padding: 6px;
            border-radius: 3px;
            page-break-inside: avoid;
            height: 135mm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .slip-header {
            text-align: center;
            border-bottom: 1px solid #333;
            padding-bottom: 3px;
            margin-bottom: 3px;
        }

        .slip-header h3 {
            margin: 0;
            font-size: 9px;
            font-weight: bold;
        }

        .slip-header p {
            margin: 1px 0;
            font-size: 7px;
        }

        .slip-student {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 2px;
        }

        .slip-details {
            font-size: 7px;
            margin-bottom: 2px;
        }

        .slip-details table {
            width: 100%;
            border-collapse: collapse;
        }

        .slip-details td {
            padding: 1px 2px;
        }

        .slip-details .label {
            color: #666;
        }

        .slip-details .value {
            font-weight: bold;
            text-align: right;
        }

        .slip-heads {
            flex: 1;
            margin: 2px 0;
            font-size: 6.5px;
        }

        .slip-heads table {
            width: 100%;
            border-collapse: collapse;
        }

        .slip-heads th {
            background: #f0f0f0;
            padding: 1px 2px;
            text-align: left;
            font-size: 6px;
        }

        .slip-heads td {
            padding: 1px 2px;
            border-bottom: 1px dotted #eee;
        }

        .slip-heads td.amt {
            text-align: right;
            font-weight: bold;
        }

        .slip-total {
            border-top: 1px solid #333;
            padding-top: 2px;
            margin-top: auto;
        }

        .slip-total table {
            width: 100%;
            border-collapse: collapse;
        }

        .slip-total td {
            padding: 1px 2px;
            font-size: 7px;
        }

        .slip-total .grand {
            font-size: 9px;
            font-weight: bold;
        }

        .page-break {
            page-break-before: always;
        }

        .no-break {
            page-break-inside: avoid;
        }
    </style>
</head>

<body>
    @php
        $slipsPerPage = $columns * $rows; // 3 * 2 = 6
        $chunks = $payslips->chunk($slipsPerPage);
    @endphp

    @foreach ($chunks as $pageIndex => $pageSlips)
        <div class="page {{ $pageIndex > 0 ? 'page-break' : '' }}">
            <div class="slip-grid">
                @foreach ($pageSlips as $slip)
                    <div class="slip">
                        <!-- Header -->
                        <div class="slip-header">
                            <h3>STUDYFLOW</h3>
                            <p>Fee Payment Receipt</p>
                            <p>Receipt #{{ $slip['receipt_no'] }}</p>
                        </div>

                        <!-- Student Info -->
                        <div class="slip-student">{{ $slip['student_name'] }}</div>
                        <div class="slip-details">
                            <table>
                                <tr>
                                    <td class="label">Class/Section</td>
                                    <td class="value">{{ $slip['class'] }} / {{ $slip['section'] }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Enrollment No</td>
                                    <td class="value">{{ $slip['enrollment_no'] }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Roll No</td>
                                    <td class="value">{{ $slip['roll_no'] }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Date</td>
                                    <td class="value">{{ $slip['receipt_date'] }}</td>
                                </tr>
                                <tr>
                                    <td class="label">Payment Mode</td>
                                    <td class="value">{{ $slip['payment_mode'] }}</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Fee Heads -->
                        <div class="slip-heads">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fee Head</th>
                                        <th style="text-align:right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($slip['head_details'] as $head)
                                        <tr>
                                            <td>{{ $head['fee_head_name'] }}</td>
                                            <td class="amt">₹{{ number_format($head['amount'], 2) }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>

                        <!-- Totals -->
                        <div class="slip-total">
                            <table>
                                @if ($slip['fine_amount'] > 0)
                                    <tr>
                                        <td class="label">Fine Amount</td>
                                        <td class="value">+₹{{ number_format($slip['fine_amount'], 2) }}</td>
                                    </tr>
                                @endif
                                @if ($slip['concession_amount'] > 0)
                                    <tr>
                                        <td class="label">Concession</td>
                                        <td class="value">-₹{{ number_format($slip['concession_amount'], 2) }}</td>
                                    </tr>
                                @endif
                                <tr class="grand">
                                    <td>Total Paid</td>
                                    <td class="value">₹{{ number_format($slip['paid_amount'], 2) }}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                @endforeach

                <!-- Fill empty slots -->
                @for ($i = count($pageSlips); $i < $slipsPerPage; $i++)
                    <div class="slip" style="border-style: dashed; border-color: #eee;">
                        <div
                            style="display:flex;align-items:center;justify-content:center;height:100%;color:#ddd;font-size:10px;">
                            —</div>
                    </div>
                @endfor
            </div>
        </div>
    @endforeach
</body>

</html>

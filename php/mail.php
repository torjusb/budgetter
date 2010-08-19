<?php ob_start(); ?>
<!DOCTYPE html>
<html>
	<head>
		<title>Budget</title>
		<style type="text/css">
			* {
				margin: 0;
				padding: 0;
			}
			
			body {
				padding: 10px;
				font-family: Helvetica, Arial, sans-serif;
			}
			
			p {
				font-size: 14px;
				line-height: 1.4;
				margin: 15px 0;
			}
			
			table {
				border-collapse: collapse;
				width: 600px;
				margin: 20px 0;
			}		
			
				.text-col {
					width: 220px;
				}
				table td, table th {
					border: 1px solid #999;
					padding: 8px;
				}
				
				tfoot tr:first-child td {
					border-top-width: 2px;
				}
				tfoot td {
					font-weight: 700;
				}
			
			tr td:nth-of-type(2n) {
				text-align: right;
			}	
		</style>
	</head>
	<body>
		<h1>Budget fail</h1>
		<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
		
		<table>
			<colgroup>
				<col class="text-col" />
				<col class="num-col" />
				<col class="text-col" />
				<col class="num-col" />
			</colgroup>
			
			<thead>
				<tr>
					<th colspan="2">Incomes</th>
					<th colspan="2">Outcomes</th>
				</tr>
			</thead>
			
			<tfoot>
				<tr>
					<td>Total</td>
					<td>213</td>
					<td>Total</td>
					<td>91</td>
				</tr>
				<tr>
					<td colspan="3">Difference</td>
					<td>-399</td>
				</tr>
			</tfoot>
			
			<tbody>
				<tr>
					<td>Something</td>
					<td>344</td>
					<td>Something else</td>
					<td>200</td>
				</tr>
				<tr>
					<td>Cake</td>
					<td>3001</td>
					<td>Paper</td>
					<td>300</td>
				</tr>
				<tr>
					<td>Tester</td>
					<td>111</td>
					<td>Fail</td>
					<td>999</td>
				</tr>
				<tr>
					<td>Ya</td>
					<td>113</td>
					<td>Ha</td>
					<td>131</td>
				</tr>
			</tbody>
		</table>
	</body>
</html>
<?php
$content = ob_get_contents();
ob_end_clean();
echo $content;

if (isset($_GET['send'])) {
	$headers  = 'MIME-Version: 1.0' . "\r\n";
	$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
	
	mail('...', 'testing', $content, $headers);
}